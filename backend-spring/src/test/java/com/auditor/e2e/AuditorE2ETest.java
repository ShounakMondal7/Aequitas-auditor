package com.auditor.e2e;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuditorE2ETest {

    private static final String FRONTEND_URL = "http://localhost:5173";
    private static final String DATASET_RELATIVE_PATH = "../engine/sandbox/sample_credit_data.csv";

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        // Headless execution for automated CI/CD and terminal runners
        boolean isHeadless = Boolean.parseBoolean(System.getProperty("headless", "true"));
        if (isHeadless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--disable-gpu");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");

        // Selenium 4.10+ automatically manages ChromeDriver binaries via SeleniumManager
        this.driver = new ChromeDriver(options);
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(90));
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @Order(1)
    @DisplayName("E2E Test: Upload dataset, trigger HITL policy gate, approve remediation, and verify Recharts output")
    void testAutonomousAuditAndHitlApprovalE2E() {
        // Step 1: Verify synthetic test dataset exists locally
        System.out.println("[E2E Step 1] Verifying synthetic test dataset exists locally...");
        Path sampleDataset = Paths.get(DATASET_RELATIVE_PATH).toAbsolutePath().normalize();
        assertTrue(Files.exists(sampleDataset), "Sample credit dataset must exist at: " + sampleDataset);

        // Step 2: Navigate to Vite React frontend
        System.out.println("[E2E Step 2] Navigating to Vite React frontend at: " + FRONTEND_URL);
        driver.get(FRONTEND_URL);
        assertEquals("Autonomous AI Fairness & Bias Auditor", driver.getTitle());

        // ---------------------------------------------------------------------------------
        // NAVIGATION: Bypass Landing Page and Auth Modal using exact text from UI
        // ---------------------------------------------------------------------------------
        try {
            System.out.println("[E2E Step 2.1] Attempting to bypass Landing Page if present...");
            WebElement launchButton = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions.elementToBeClickable(
                            By.xpath("//*[contains(text(), 'Launch Auditor Workspace')]")));
            launchButton.click();
            System.out.println("[E2E Step 2.1] Clicked 'Launch Auditor Workspace'.");

            System.out.println("[E2E Step 2.2] Waiting for Auth Modal and clicking 'Continue as Guest'...");
            WebElement guestButton = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions.elementToBeClickable(
                            By.xpath("//*[contains(text(), 'Continue as Guest')]")));
            guestButton.click();
            System.out.println("[E2E Step 2.2] Clicked 'Continue as Guest'.");

            // Give the React DOM a moment to unmount the modal and render the dashboard
            Thread.sleep(1500);
        } catch (Exception e) {
            System.out.println("[E2E Step 2 Note] Navigation bypassed or already on dashboard: " + e.getMessage());
        }
        // ---------------------------------------------------------------------------------

        // Step 3: Locate file input and attach CSV dataset
        System.out.println("[E2E Step 3] Locating hidden file input and attaching dataset: " + sampleDataset);
        WebElement fileInput = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("input[type='file']")));
        assertNotNull(fileInput, "Hidden file input should be present in DOM");
        fileInput.sendKeys(sampleDataset.toString());
        System.out.println("[E2E Step 3] Dataset path sent to file input.");

        // Check if an explicit run/analyze/load button is present and click if needed
        try {
            List<WebElement> runButtons = driver.findElements(
                    By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'run audit') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'analyze')]"));
            for (WebElement btn : runButtons) {
                if (btn.isDisplayed() && btn.isEnabled()) {
                    System.out.println("[E2E Step 3.1] Triggering explicit run button: " + btn.getText());
                    btn.click();
                    break;
                }
            }
        } catch (Exception ignored) {
        }

        // Step 4: Verify agent terminal logs / AI reasoning stream appears
        System.out.println("[E2E Step 4] Waiting for AI Reasoning Stream / Terminal container to be visible...");
        WebElement terminalContainer = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'ai reasoning stream') " +
                         "or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'terminal') " +
                         "or contains(@class, 'terminal-scroll') " +
                         "or contains(text(), 'Ingesting CSV stream') " +
                         "or contains(text(), 'System Ready')]")));
        assertNotNull(terminalContainer, "Terminal / AI reasoning stream should be visible upon file submission");
        System.out.println("[E2E Step 4] Terminal / AI reasoning stream verified visible.");

        // Step 5: Wait for Human-in-the-Loop approval button to appear
        System.out.println("[E2E Step 5] Waiting for Human-in-the-Loop approval button to appear...");
        WebElement approveButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'approve remediation') " +
                         "or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'approve fix') " +
                         "or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'approve')]")));
        assertNotNull(approveButton, "HITL Approval action button should be present and clickable");
        System.out.println("[E2E Step 5] Found HITL approval button with text: '" + approveButton.getText() + "'");

        // Step 6: Operator approves the algorithmic remediation fix
        System.out.println("[E2E Step 6] Clicking HITL approval button...");
        approveButton.click();
        System.out.println("[E2E Step 6] Remediation approved successfully.");

        // Step 7: Switch to Fairness Charts tab in the Audit Vault if necessary to expose Recharts
        System.out.println("[E2E Step 7] Ensuring Fairness Charts view is active in the Audit Vault...");
        try {
            WebElement chartsTab = new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.elementToBeClickable(
                            By.xpath("//button[contains(., 'Fairness Charts') or contains(., 'Charts')]")));
            chartsTab.click();
            System.out.println("[E2E Step 7] Switched to 'Fairness Charts' tab.");
        } catch (Exception e) {
            System.out.println("[E2E Step 7 Note] Fairness Charts tab switch note: " + e.getMessage());
        }

        // Step 8: Assert that Recharts SVG renders
        System.out.println("[E2E Step 8] Waiting for Recharts visualization surface (.recharts-responsive-container or svg.recharts-surface)...");
        WebElement rechartsSurface = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".recharts-responsive-container, svg.recharts-surface")));
        assertTrue(rechartsSurface.isDisplayed(), "Recharts visualization should be visible after audit completion");
        System.out.println("[E2E Step 8] Recharts surface verified visible.");

        // Step 9: Assert that Disparate Impact Metric card is rendered
        System.out.println("[E2E Step 9] Verifying Disparate Impact Metric card is rendered...");
        WebElement disparateImpactCard = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(), 'Disparate Impact')]")));
        assertTrue(disparateImpactCard.isDisplayed(), "Disparate Impact KPI card must be visible");
        System.out.println("[E2E Step 9] Disparate Impact KPI card verified visible.");
        System.out.println("[E2E SUCCESS] All autonomous audit and HITL approval assertions passed.");
    }
}