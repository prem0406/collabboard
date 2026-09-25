package com.collabboard.dto.response;

import com.collabboard.entity.BoardList;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ListResponse {
    String id;
    String name;
    String boardId;
    int position;
    List<CardResponse> cards;

    public static ListResponse from(BoardList l, List<CardResponse> cards) {
        return ListResponse.builder()
                .id(l.getId())
                .name(l.getName())
                .boardId(l.getBoard().getId())
                .position(l.getPosition())
                .cards(cards)
                .build();
    }
}