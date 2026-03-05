package com.himanshu.loadlens.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class root {
    @GetMapping("/")
    public String welcome(){
        return "hello from server";
    }
}
