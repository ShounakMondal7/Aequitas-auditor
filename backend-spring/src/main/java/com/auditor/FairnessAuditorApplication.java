package com.auditor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FairnessAuditorApplication {

    public static void main(String[] args) {
        SpringApplication.run(FairnessAuditorApplication.class, args);
    }
}
