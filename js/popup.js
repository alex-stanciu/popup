/**
 * @file
 * Adds functionality for popups.
 */

var Popup = (function ($) {
  'use strict';

  var body = $('body');
  var popups = [];
  var openPopups = {};
  var openPopupsFifo = [];

  window.addEventListener('keyup', function (event) {
    // On ESC close upper most popup.
    if (event.keyCode === 27) {
      Popup.close();
    }
  });

  /**
   * Create a popup object.
   *
   * @param {string|Object} element
   *   The element or selector.
   * @param {string} id
   *   The ID of this popup.
   * @constructor
   */
  function Popup(element, id) {
    this.element = $(element);
    this.id = id || this.element.attr('id');

    this._listeners = {open: [], close: []};
    this.registerClose();

    popups.push(this);
    Popup.emit("created", this);
  }

  Popup.overlay = $(".overlay");
  Popup.overlay.on("click", function () {
    if (openPopupsFifo.length) {
      openPopupsFifo[openPopupsFifo.length - 1].close();
    }
  });

  Popup._listeners = {};

  /**
   * Registers an event listener.
   *
   * @param {string} event
   *   The event name.
   * @param {Function} callback
   *   The callback.
   */
  Popup.on = function (event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }

    if (!(callback instanceof Function)) {
      throw new Error('Callback is not a function: ' + callback);
    }

    this._listeners[event].push(callback);
  };

  /**
   * Emits an event.
   *
   * @param {string} event
   *   The event name.
   * @param {*} data
   *   Array of data to send to listeners.
   */
  Popup.emit = function (event, data) {
    if (!this._listeners[event]) {
      return;
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    for (var i = 0; i < this._listeners[event].length; ++i) {
      this._listeners[event][i].apply(this, data);
    }
  };

  /**
   * Gets a popup object by ID.
   *
   * @param {string} id
   * @return {null|Popup}
   */
  Popup.getById = function (id) {
    for (var i = 0; i < popups.length; ++i) {
      if (popups[i].id === id) {
        return popups[i];
      }
    }

    return null;
  };

  /**
   * Extends popup by ID.
   *
   * @param {Array|string} id
   *   The popup ID.
   * @param {Function} extender
   *   The extender callback.
   */
  Popup.extend = function (id, extender) {
    if (!this._extends) {
      this._extends = {};

      // Listen to creation of popups and extend them accordingly.
      Popup.on("created", function (popup) {
        var extenders = Popup._extends[popup.id];
        if (!extenders) {
          return;
        }

        for (var i = 0; i < extenders.length; ++i) {
          extenders[i](popup);
        }
      });
    }

    if (!Array.isArray(id)) {
      id = [id];
    }

    for (var i = 0; i < id.length; ++i) {
      if (!this._extends[id[i]]) {
        this._extends[id[i]] = [];
      }

      this._extends[id[i]].push(extender);

      // Make sure existing popups are also extended.
      var popup = Popup.getById(id[i]);
      if (popup) {
        extender(popup);
      }
    }
  };

  /**
   * Creates a new popup from raw html.
   *
   * @param {string} html
   *   Raw html.
   * @returns {Popup}
   */
  Popup.register = function (html, id) {
    var popup = $(html);
    $('body').append(popup);
    return new Popup(popup, id);
  };

  /**
   * Closes popup with given id.
   *
   * @param {string} id
   *   (Optional) The popup id. If left out closes the upper-most.
   */
  Popup.close = function (id) {
    if (!id && openPopupsFifo.length) {
      openPopupsFifo[openPopupsFifo.length - 1].close();
    } else if (openPopups[id]) {
      openPopups[id].close();
    }
  };

  /**
   * Closes all popups.
   */
  Popup.closeAll = function() {
    while (openPopupsFifo.length) {
      openPopupsFifo[0].close();
    }
  };

  /**
   * Closes all but current popup.
   */
  Popup.closePrevious = function() {
    if (!openPopupsFifo.length) {
      return;
    }

    while (openPopupsFifo.length !== 1) {
      openPopupsFifo[0].close();
    }
  };

  /**
   * Determines whether the popup is open.
   * @return {boolean}
   */
  Popup.prototype.isOpen = function () {
    return this.element.hasClass('open');
  };

  /**
   * Toggles the state of the popup.
   * @return {Popup}
   */
  Popup.prototype.toggle = function () {
    this.setState(!this.isOpen());
    return this;
  };

  /**
   * Opens the popup.
   * @return {Popup}
   */
  Popup.prototype.open = function () {
    if (this.isOpen()) {
      return this;
    }

    this.setState(1);
    return this;
  };

  /**
   * Closes the popup.
   * @return {Popup}
   */
  Popup.prototype.close = function () {
    if (!this.isOpen()) {
      return this;
    }

    this.setState(0);
    return this;
  };

  /**
   * Registers an event listener.
   *
   * @param {string} event
   *   The event name.
   * @param {Function} callback
   *   The callback.
   */
  Popup.prototype.on = function (event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }

    this._listeners[event].push(callback);
  };

  /**
   * Emits an event.
   *
   * @param {string} event
   *   The event name.
   */
  Popup.prototype.emit = function (event) {
    if (!this._listeners[event]) {
      return;
    }

    for (var i = 0; i < this._listeners[event].length; ++i) {
      this._listeners[event][i](this);
    }
  };

  /**
   * Sets the open state.
   */
  Popup.prototype.setState = function (state) {
    state = state ? 1 : 0;
    var stateSetter = ['removeClass', 'addClass'][state];

    if (state) {
      this.id && (openPopups[this.id] = this);
      openPopupsFifo.push(this);
    } else {
      this.id && delete openPopups[this.id];
      openPopupsFifo.splice(openPopupsFifo.indexOf(this), 1);
    }

    this.element[stateSetter]('open');

    if (
      (state && openPopupsFifo.length === 1) ||
      (!state && openPopupsFifo.length === 0)
    ) {
      Popup.overlay[stateSetter]('open');
      body[stateSetter]('no-scroll');
    }

    this.emit(['close', 'open'][state]);
    Popup.emit(['close', 'open'][state], this);
  };

  /**
   * Registers close buttons that are in the popup.
   */
  Popup.prototype.registerClose = function () {
    var self = this;

    $('[data-popup-close]', this.element).once('popup-close-btn').each(function () {
      $(this).on('click', self.close.bind(self));
    });

    $('[data-popup-toggle]', this.element).once('popup-toggle-btn').each(function () {
      $(this).on('click', self.toggle.bind(self));
    });
  };

  return Popup;

})(jQuery);
