package com.collabboard.dto.response;

import com.collabboard.entity.Card;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class CardResponse {
    String id;
    String title;
    String description;
    String listId;
    int position;
    Instant createdAt;
    Instant updatedAt;

    public static CardResponse from(Card c) {
        return CardResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .listId(c.getList().getId())
                .position(c.getPosition())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}