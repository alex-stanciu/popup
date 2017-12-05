<?php

namespace Drupal\popup\Ajax;

use Drupal\Core\Ajax\CommandInterface;

/**
 * Popup close command.
 *
 * @package Drupal\popup\Ajax
 */
class PopupCloseCommand implements CommandInterface {

  /**
   * The popup ID.
   *
   * @var string
   */
  protected $id;

  /**
   * PopupCloseCommand constructor.
   *
   * @param string $id
   *   The popup ID.
   */
  public function __construct($id) {
    $this->id = $id;
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    return [
      'command' => 'closePopup',
      'id' => $this->id,
    ];
  }

}
