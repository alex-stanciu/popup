/**
 * @file
 * Adds functionality for popups.
 */

/* eslint no-unused-vars: 0 */

const $ = jQuery;
const body = $('body');
const popups = [];
const openPopups = {};
const openPopupsFifo = [];
const overlay = $('.overlay');

overlay.on('click', () => {
  if (openPopupsFifo.length) {
    openPopupsFifo[openPopupsFifo.length - 1].close();
  }
});

/**
 * Closes the given popup.
 *
 * @param {int} id
 *   The popup id.
 */
function closePopup(id) {
  if (openPopups[id]) {
    openPopups[id].close();
  }
}

class Popup {
  /**
   * Create a popup object.
   *
   * @param {string|Object} element
   *   The element or selector.
   * @param {string} id
   *   The ID of this popup.
   * @constructor
   */
  constructor(element, id) {
    this.element = $(element);
    this.id = id || this.element.attr('id');

    this._listeners = { open: [], close: [] };

    popups.push(this);
    this.emitData('created', this);

    this._listeners = {};

    window.addEventListener('keyup', (event) => {
      // On ESC close upper most popup.
      if (event.keyCode === 27) {
        closePopup(this.id);
      }
    });
    this.registerClose();
  }

  /**
   * Emits an event.
   *
   * @param {string} event
   *   The event name.
   * @param {*} data
   *   Array of data to send to listeners.
   */
  emitData(event, data) {
    if (!this._listeners[event]) {
      return;
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    for (let i = 0; i < this._listeners[event].length; ++i) {
      this._listeners[event][i].apply(this, data);
    }
  }

  /**
   * Gets a popup object by ID.
   *
   * @param {string} id
   *   The id.
   * @return {null|Popup}
   *   The popup, if found.
   */
  static getById(id) {
    for (let i = 0; i < popups.length; ++i) {
      if (popups[i].id === id) {
        return popups[i];
      }
    }

    return null;
  }

  /**
   * Extends popup by ID.
   *
   * @param {Array|string} id
   *   The popup ID.
   * @param {Function} extender
   *   The extender callback.
   */
  extend(id, extender) {
    if (!this._extends) {
      this._extends = {};

      // Listen to creation of popups and extend them accordingly.
      Popup.on('created', (popup) => {
        const extenders = this._extends[popup.id];
        if (!extenders) {
          return;
        }

        for (let i = 0; i < extenders.length; ++i) {
          extenders[i](popup);
        }
      });
    }

    if (!Array.isArray(id)) {
      id = [id];
    }

    for (let i = 0; i < id.length; ++i) {
      if (!this._extends[id[i]]) {
        this._extends[id[i]] = [];
      }

      this._extends[id[i]].push(extender);

      // Make sure existing popups are also extended.
      const popup = Popup.getById(id[i]);
      if (popup) {
        extender(popup);
      }
    }
  }

  /**
   * Creates a new popup from raw html.
   *
   * @param {string} html
   *   Raw html.
   * @param {string} id
   *   The id.
   * @return {Popup}
   *   The new popup.
   */
  static register(html, id) {
    const popup = $(html);
    $('body').append(popup);
    return new Popup(popup, id);
  }

  /**
   * Closes all popups.
   */
  static closeAll() {
    while (openPopupsFifo.length) {
      openPopupsFifo[0].close();
    }
  }

  /**
   * Closes all but current popup.
   */
  static closePrevious() {
    if (!openPopupsFifo.length) {
      return;
    }

    while (openPopupsFifo.length !== 1) {
      openPopupsFifo[0].close();
    }
  }

  /**
   * Determines whether the popup is open.
   *
   * @return {boolean}
   *   True if class is present, false otherwise.
   */
  isOpen() {
    return this.element.hasClass('open');
  }

  /**
   * Toggles the state of the popup.
   *
   * @return {Popup}
   *   The toggled popup.
   */
  toggle() {
    this.setState(this.isOpen() ? 0 : 1);
    return this;
  }

  /**
   * Opens the popup.
   *
   * @return {Popup}
   *   The popup.
   */
  open() {
    if (this.isOpen()) {
      return this;
    }

    this.setState(1);
    return this;
  }

  /**
   * Closes the popup.
   *
   * @return {Popup}
   *   The closed popup.
   */
  close() {
    if (!this.isOpen()) {
      return this;
    }

    this.setState(0);
    return this;
  }

  /**
   * Registers an event listener.
   *
   * @param {string} event
   *   The event name.
   * @param {Function} callback
   *   The callback.
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  /**
   * Emits an event.
   *
   * @param {string} event
   *   The event name.
   */
  emit(event) {
    if (!this._listeners[event]) {
      return;
    }

    for (let i = 0; i < this._listeners[event].length; ++i) {
      this._listeners[event][i](this);
    }
  }

  /**
   * Sets the open state.
   *
   * @param {int} state
   *   The state.
   */
  setState(state) {
    const stateSetter = ['removeClass', 'addClass'][state];
    if (state) {
      if (this.id) {
        openPopups[this.id] = this;
      }
      openPopupsFifo.push(this);
    }
    else {
      if (this.id) {
        delete openPopups[this.id];
      }
      openPopupsFifo.splice(openPopupsFifo.indexOf(this), 1);
    }

    this.element[stateSetter]('open');

    if (
      (state && openPopupsFifo.length === 1) ||
      (!state && openPopupsFifo.length === 0)
    ) {
      overlay[stateSetter]('open');
      body[stateSetter]('no-scroll');
    }

    this.emit(['close', 'open'][state]);
    this.emitData(['close', 'open'][state], this);
  }

  /**
   * Registers close buttons that are in the popup.
   */
  registerClose() {
    const self = this;
    $('[data-popup-close]', this.element).each((index, element) => {
      $(element).on('click', self.close.bind(self));
    });

    $('[data-popup-toggle]', this.element).each((index, element) => {
      $(element).on('click', self.toggle.bind(self));
    });
  }
}
