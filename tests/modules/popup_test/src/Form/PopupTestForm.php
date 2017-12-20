<?php

namespace Drupal\popup_test\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\popup\Ajax\PopupCommand;

/**
 * Class PopupTestForm.
 *
 * @package Drupal\popup_test\Form
 */
class PopupTestForm extends FormBase {

  /**
   * Returns a unique string identifying the form.
   *
   * @return string
   *   The unique string identifying the form.
   */
  public function getFormId() {
    return 'form_popup_test';
  }

  /**
   * Form constructor.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   *
   * @return array
   *   The form structure.
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form = [];
    $form['actions']['submit'] = [
      '#id' => 'popup-form-submit-btn',
      '#type' => 'submit',
      '#value' => $this->t('Save'),
      '#ajax' => [
        'callback' => '::ajaxSubmit',
      ],
    ];
    $form['#attached']['library'] = [
      'popup_test/popup_test',
      'popup/popup',
    ];
    return $form;
  }

  /**
   * Form submission handler.
   *
   * @param array $form
   *   An associative array containing the structure of the form.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The current state of the form.
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // TODO: Implement submitForm() method.
  }

  /**
   * Ajax submit.
   *
   * {@inheritdoc}
   */
  public function ajaxSubmit(array $form, FormStateInterface $form_state) {
    $popup = [
      '#theme' => 'popup-theme',
      '#title' => ['#markup' => $this->t('Popup title')],
      '#content' => ['#markup' => $this->t('Popup body')],
      '#close' => ['#markup' => $this->t('Close')],
    ];
    $command = new PopupCommand($popup, 'test-popup');
    $response = new AjaxResponse();
    $response->addCommand($command);
    return $response;
  }

}
