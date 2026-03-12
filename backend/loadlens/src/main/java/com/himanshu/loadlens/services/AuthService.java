package com.himanshu.loadlens.services;

import com.himanshu.loadlens.dto.AuthenticationResponse;
import com.himanshu.loadlens.dto.UserLoginDTO;
import com.himanshu.loadlens.dto.UserRegisterDTO;
import com.himanshu.loadlens.dto.UserResponseDTO;

public interface AuthService {

    AuthenticationResponse registerUser(UserRegisterDTO request);

    AuthenticationResponse loginUser(UserLoginDTO request);

    UserResponseDTO getCurrentUser(String token);
}
