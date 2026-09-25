package com.collabboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContentRequest {
    @NotBlank
    private String content;
}