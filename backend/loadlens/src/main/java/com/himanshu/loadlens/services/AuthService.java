package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.UserLoginDTO;
import com.himanshu.loadlens.dto.UserRegisterDTO;
import com.himanshu.loadlens.dto.UserResponseDTO;

public interface AuthService {

    UserResponseDTO registerUser(UserRegisterDTO request);

    UserResponseDTO loginUser(UserLoginDTO request);
}
