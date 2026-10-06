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

        // Selenium 4.10+ automatically manages ChromeDriver binaries via
        // SeleniumManager
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
        Path sampleDataset = Paths.get(DATASET_RELATIVE_PATH).toAbsolutePath().normalize();
        assertTrue(Files.exists(sampleDataset), "Sample credit dataset must exist at: " + sampleDataset);

        // Step 2: Navigate to Vite React frontend
        driver.get(FRONTEND_URL);
        assertEquals("Autonomous AI Fairness & Bias Auditor", driver.getTitle());

        // ---------------------------------------------------------------------------------
        // NAVIGATION FIX: Bypass Landing Page and Auth Modal using exact text from UI
        // ---------------------------------------------------------------------------------
        try {
            // 1. Click "Launch Auditor Workspace" on the main landing page
            WebElement launchButton = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions
                            .elementToBeClickable(By.xpath("//*[contains(text(), 'Launch Auditor Workspace')]")));
            launchButton.click();

            // 2. Wait for the Auth Modal to pop up, then click "Continue as Guest"
            WebElement guestButton = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions
                            .elementToBeClickable(By.xpath("//*[contains(text(), 'Continue as Guest')]")));
            guestButton.click();

            // Give the React DOM a moment to unmount the modal and render the dashboard
            Thread.sleep(2000);
        } catch (Exception e) {
            System.out.println("Navigation error or already on dashboard: " + e.getMessage());
        }
        // ---------------------------------------------------------------------------------

        // Step 3: Locate file input and upload CSV dataset
        WebElement fileInput = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("input[type='file']")));
        assertNotNull(fileInput, "Hidden file input should be present in DOM");
        fileInput.sendKeys(sampleDataset.toString());

        // Step 4: Verify agent terminal logs appear
        WebElement terminalHeader = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(), 'Antigravity Agent Runtime Terminal')]")));
        assertNotNull(terminalHeader, "Terminal log stream should be rendered upon file submission");

        // Step 5: Wait for the Human-in-the-Loop modal to appear (agent requests
        // mutation approval)
        WebElement approveButton = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(., 'Approve Fix')]")));
        assertNotNull(approveButton, "HITL Approval Modal should display 'Approve Fix' button");

        // Step 6: Operator approves the algorithmic remediation fix
        approveButton.click();

        // Step 7: Wait for the audit to complete and assert that Recharts SVG renders
        WebElement rechartsSurface = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".recharts-responsive-container, svg.recharts-surface")));
        assertTrue(rechartsSurface.isDisplayed(), "Recharts visualization should be visible after audit completion");

        // Step 8: Assert that Disparate Impact Metric card is rendered
        WebElement disparateImpactCard = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//*[contains(text(), 'Disparate Impact Ratio')]")));
        assertTrue(disparateImpactCard.isDisplayed(), "Disparate Impact KPI card must be visible");
    }
}