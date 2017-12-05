<?php

namespace Drupal\popup\Ajax;

use Drupal\Core\Ajax\AppendCommand;

/**
 * Popup addition command.
 *
 * @package Drupal\popup\Ajax
 */
class PopupCommand extends AppendCommand {

  /**
   * The popup ID.
   *
   * @var string
   */
  protected $id;

  /**
   * PopupCommand constructor.
   *
   * @param array $content
   *   Popup content to render.
   * @param string $id
   *   The popup ID.
   * @param string $selector
   *   Where to add the popup.
   */
  public function __construct(array $content, $id = '', $selector = '.body') {
    parent::__construct($selector, $content, []);
    $this->id = $id;
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    return ['command' => 'showPopup', 'id' => $this->id] + parent::render();
  }

}
