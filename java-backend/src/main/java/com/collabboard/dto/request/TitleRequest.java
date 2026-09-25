package com.collabboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TitleRequest {
    @NotBlank
    private String title;
}