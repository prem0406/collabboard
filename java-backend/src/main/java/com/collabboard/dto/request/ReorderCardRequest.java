package com.collabboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ReorderCardRequest {

    @NotBlank
    private String cardId;

    @NotBlank
    private String destinationListId;

    @NotEmpty
    private List<String> orderedCardIds;

    // present only when the card moved between lists
    private String sourceListId;
    private List<String> sourceOrderedCardIds;
}