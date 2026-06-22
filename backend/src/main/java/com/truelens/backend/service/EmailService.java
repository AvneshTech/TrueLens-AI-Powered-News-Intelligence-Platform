package com.truelens.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * PHASE 3: transactional email via the Resend HTTP API (https://resend.com).
 *
 * Uses the shared RestTemplate (with timeouts). The API key stays server-side in
 * RESEND_API_KEY. Email failures are logged but never thrown to the caller, so a
 * mail outage can't block registration — the user can re-request the link.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${app.mail.from:TrueLens <onboarding@resend.dev>}")
    private String fromAddress;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public EmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendVerificationEmail(String to, String name, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;
        String html = baseTemplate(
                "Verify your email",
                safe(name),
                "Welcome to TrueLens! Confirm your email address to activate your account and start detecting fake news.",
                "Verify Email",
                link,
                "This link expires in 24 hours. If you didn't create a TrueLens account, you can safely ignore this email."
        );
        send(to, "Verify your TrueLens account", html);
    }

    public void sendPasswordResetEmail(String to, String name, String token) {
        String link = frontendUrl + "/auth/reset-password?token=" + token;
        String html = baseTemplate(
                "Reset your password",
                safe(name),
                "We received a request to reset your TrueLens password. Click the button below to choose a new one.",
                "Reset Password",
                link,
                "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change."
        );
        send(to, "Reset your TrueLens password", html);
    }

    // ── transport ──────────────────────────────────────────────────────────
    private void send(String to, String subject, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — skipping email '{}' to {}", subject, to);
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(resendApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "from", fromAddress,
                    "to", List.of(to),
                    "subject", subject,
                    "html", html
            );

            HttpEntity<String> req =
                    new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<String> resp =
                    restTemplate.postForEntity(RESEND_URL, req, String.class);

            if (!resp.getStatusCode().is2xxSuccessful()) {
                log.error("Resend returned {} for '{}': {}", resp.getStatusCode(), subject, resp.getBody());
            } else {
                log.info("Sent '{}' to {}", subject, to);
            }
        } catch (Exception e) {
            log.error("Failed to send '{}' to {}: {}", subject, to, e.getMessage());
        }
    }

    // ── responsive HTML template ─────────────────────────────────────────────
    private String baseTemplate(String heading, String name, String intro,
                                String ctaLabel, String ctaUrl, String footerNote) {
        return """
            <!DOCTYPE html>
            <html lang="en"><head><meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
                <tr><td align="center">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <tr><td style="background:#0f172a;padding:24px 32px;">
                      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">🔎 TrueLens</span>
                    </td></tr>
                    <tr><td style="padding:32px;">
                      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">%s</h1>
                      <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi %s,</p>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">%s</p>
                      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#2563eb;">
                        <a href="%s" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">%s</a>
                      </td></tr></table>
                      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">%s</p>
                      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">Or paste this link into your browser:<br>%s</p>
                    </td></tr>
                    <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;font-size:12px;color:#94a3b8;">Need help? Contact <a href="mailto:support@truelens.app" style="color:#2563eb;text-decoration:none;">support@truelens.app</a></p>
                      <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">© TrueLens. All rights reserved.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(heading, name, intro, ctaUrl, ctaLabel, footerNote, ctaUrl);
    }

    private String safe(String s) {
        if (s == null || s.isBlank()) return "there";
        return s.replace("<", "&lt;").replace(">", "&gt;");
    }
}
