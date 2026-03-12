package com.himanshu.loadlens.controllers;

import com.himanshu.loadlens.dto.AuthenticationResponse;
import com.himanshu.loadlens.dto.UserLoginDTO;
import com.himanshu.loadlens.dto.UserRegisterDTO;
import com.himanshu.loadlens.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.himanshu.loadlens.dto.UserResponseDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerUser(userRegisterDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody UserLoginDTO userLoginDTO) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.loginUser(userLoginDTO));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(authService.getCurrentUser(token));
    }
}
