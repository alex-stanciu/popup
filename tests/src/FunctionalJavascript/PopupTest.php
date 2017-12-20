<?php

namespace Drupal\Tests\popup\FunctionalJavascript;

use Drupal\FunctionalJavascriptTests\JavascriptTestBase;

/**
 * Class PopupTest.
 *
 * @group popup
 */
class PopupTest extends JavascriptTestBase {

  /**
   * Modules to enable.
   *
   * @var array
   */
  public static $modules = [
    'system',
    'user',
    'popup',
    'popup_test',
  ];

  /**
   * User that can access popups.
   *
   * @var \Drupal\user\UserInterface
   */
  protected $user;

  /**
   * {@inheritdoc}
   */
  protected function setUp() {
    parent::setUp();

    // Create user that can access the popup test page.
    $this->user = $this->drupalCreateUser(['administer site configuration']);
    $this->drupalLogin($this->user);
    $this->drupalGet('tests/popup_test');
  }

  /**
   * Tests the popup functionality.
   */
  public function testPopups() {
    $session_assert = $this->assertSession();
    $page = $this->getSession()->getPage();
    $session_assert->statusCodeEquals(200);

    // Checks if the form was rendered.
    $session_assert->pageTextContains(t('Save'));

    $popup = $this->getNewPopup();

    // Checks if the popup was rendered properly.
    $session_assert->pageTextContains(t('Popup title'));
    $session_assert->pageTextContains(t('Close'));
    $session_assert->pageTextContains(t('Popup body'));

    // Checks if the popup is present and has the correct classes.
    $this->assertTrue(!empty($popup), 'The popup containing the open class is not present.');

    // Checks if the close button works.
    $this->assertTrue($popup->has('css', '.open'), 'The open class is not set.');
    $page->pressButton(t('Close'));
    $this->assertFalse($popup->has('css', '.open'), 'The open class was not removed.');

    // Checks if the X button works.
    $popup = $this->getNewPopup();
    $this->assertTrue($popup->has('css', '.open'), 'The open class is not set.');
    $this->click('.popup-wrapper.open>.escape-icon');
    $this->assertFalse($popup->has('css', '.open'), 'The open class was not removed.');

    // Checks if the ESC key works.
    $popup = $this->getNewPopup();
    $this->assertTrue($popup->has('css', '.open'), 'The open class is not set.');
    $enter_key_event = <<<JS
jQuery(window).trigger(
  new jQuery.Event('keyup', {
    keyCode: 27
  }));
JS;

    // PhantomJS driver has buggy behavior with key events, we send a JavaScript
    // key event instead.
    $this->getSession()->evaluateScript($enter_key_event);
    $this->assertFalse($popup->has('css', '.open'), 'The open class was not removed.');
  }

  /**
   * Triggers an AJAX request that appends a new popup.
   *
   * @return \Behat\Mink\Element\NodeElement|mixed|null
   *   The popup.
   */
  public function getNewPopup() {
    $this->getSession()->getPage()->pressButton(t('Save'));
    $this->assertSession()->assertWaitOnAjaxRequest();
    return $this->getSession()->getPage()->find('css', '.popup-wrapper.popup.open');
  }

}
