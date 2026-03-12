package com.himanshu.loadlens.services;

import com.himanshu.loadlens.config.JwtService;
import com.himanshu.loadlens.dto.AuthenticationResponse;
import com.himanshu.loadlens.dto.UserLoginDTO;
import com.himanshu.loadlens.dto.UserRegisterDTO;
import com.himanshu.loadlens.dto.UserResponseDTO;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthenticationResponse registerUser(UserRegisterDTO request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is Required");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        var jwtToken = jwtService.generateToken(savedUser);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .user(mapToResponse(savedUser))
                .build();
    }

    @Override
    public AuthenticationResponse loginUser(UserLoginDTO request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is Required");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        User getUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        var jwtToken = jwtService.generateToken(getUser);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .user(mapToResponse(getUser))
                .build();
    }

    @Override
    public UserResponseDTO getCurrentUser(String token) {
        String jwtToken = token.replace("Bearer ", "");
        String email = jwtService.extractUsername(jwtToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    private UserResponseDTO mapToResponse(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .provider(user.getProvider().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
