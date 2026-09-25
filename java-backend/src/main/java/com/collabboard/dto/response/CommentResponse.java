package com.collabboard.dto.response;

import com.collabboard.entity.Comment;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class CommentResponse {
    String id;
    String cardId;
    String authorId;
    String authorName;
    String content;
    Instant createdAt;

    public static CommentResponse from(Comment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .cardId(c.getCard().getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }
}