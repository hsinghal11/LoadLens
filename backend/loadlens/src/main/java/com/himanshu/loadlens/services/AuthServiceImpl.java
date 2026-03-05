package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.UserLoginDTO;
import com.himanshu.loadlens.dto.UserRegisterDTO;
import com.himanshu.loadlens.dto.UserResponseDTO;
import com.himanshu.loadlens.entity.User;
import com.himanshu.loadlens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    @Override
//    @Transactional
    public UserResponseDTO registerUser(UserRegisterDTO request) {
        if(request.getEmail() == null || request.getEmail().isBlank()){
            throw new IllegalArgumentException("Email is Required");
        }
        if(userRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
//    @Transactional(readOnly = true)
    public UserResponseDTO loginUser(UserLoginDTO request) {
        if(request.getEmail() == null || request.getEmail().isBlank()){
            throw new IllegalArgumentException("Email is Required");
        }
        User getUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(()-> new RuntimeException("Email not found"));

        if(!Objects.equals(getUser.getPassword(), request.getPassword())) throw new RuntimeException("Invalid Password");
        return mapToResponse(getUser);
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
