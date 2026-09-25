package com.collabboard.dto.response;

import com.collabboard.entity.Attachment;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class AttachmentResponse {
    String id;
    String cardId;
    String filename;
    String mimeType;
    int fileSize;
    String url;
    String uploadedById;
    Instant createdAt;

    public static AttachmentResponse from(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId())
                .cardId(a.getCard().getId())
                .filename(a.getFilename())
                .mimeType(a.getMimeType())
                .fileSize(a.getFileSize())
                .url(a.getUrl())
                .uploadedById(a.getUploadedBy().getId())
                .createdAt(a.getCreatedAt())
                .build();
    }
}