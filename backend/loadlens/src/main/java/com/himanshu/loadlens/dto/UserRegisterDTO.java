package com.himanshu.loadlens.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRegisterDTO {
    private String name;
    private String email;
    private String password;
}
