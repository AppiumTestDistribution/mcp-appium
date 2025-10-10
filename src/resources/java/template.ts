/**
 * Resource for Java template files
 */
export default function javaTemplatesResource(server: any) {
  server.addResource({
    uri: 'generate://code-with-locators',
    name: 'Generate Code With Locators',
    description: `Generate code for the current page with locators which was retrieved from generate_locators tool.
    The code should be generated in the same priorty order as the locators were generated.
    For iOS the priority order is:
      'id',
      'accessibility id',
      '-ios predicate string',
      '-ios class chain',
      'xpath',
      'class name',
    For Android the priority order is:
       'id',
      'accessibility id',
      'xpath',
      '-android uiautomator',
      'class name',
    which follows the page factory pattern. Dont not strictly create test cases, just generate the code for locators.`,
    mimeType: 'text/plain',
    async load() {
      // Return all content directly without templates object
      return {
        message:
          'Java templates for mobile automation, use this and generate code for the current page',
        instruction:
          'Use these templates to generate code for the current page',
        text: `
package templates;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.AppiumFieldDecorator;
import io.appium.java_client.pagefactory.iOSXCUITFindBy;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import java.time.Duration;

/**
 * This class demonstrates using PageFactory with Appium for cross-platform
 * mobile app locators using @AndroidFindBy and @iOSXCUITFindBy annotations.
 * Example: 
 */
public class locators {

    // ========== LOGIN SCREEN ELEMENTS ==========

    /**
     * Username input field
     * - Android: accessibility id = "username_input"
     * - iOS: accessibility id = "username_input"
     */
    @AndroidFindBy(accessibility = "username_input")
    @iOSXCUITFindBy(accessibility = "username_input")
    

    public WebElement usernameField;

    @iOSXCUITFindBy(iOSNsPredicate = "name = 'IntegerB'")
    private WebElement textField2;

    @iOSXCUITFindBy(iOSClassChain = "XCUIElementTypeWindow/*/XCUIElementTypeTextField[2]")
    private WebElement secondTextField;

    /**
     * Constructor that initializes the PageFactory
     * 
     * @param driver AppiumDriver instance
     */
    public locators(AppiumDriver driver) {
        PageFactory.initElements(new AppiumFieldDecorator(driver, Duration.ofSeconds(10)), this);
    }
}
    `,
      };
    },
  });
}
