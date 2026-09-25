package com.collabboard.dto.request;

import com.collabboard.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddMemberRequest {
    @NotBlank
    @Email
    private String email;

    @NotNull
    private Role role;
}