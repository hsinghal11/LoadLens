package com.himanshu.loadlens.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class root {
    @Value("${GOOGLE_CLIENT_ID}")
    private String googleClientid;

    @GetMapping("/")
    public String welcome() {
        System.out.println(googleClientid);
        return "hello from server";
    }
}
