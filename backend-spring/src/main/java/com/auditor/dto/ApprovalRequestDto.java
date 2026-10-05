package com.auditor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ApprovalRequestDto {

    @JsonProperty("approved")
    private Boolean approved;

    public ApprovalRequestDto() {}

    public ApprovalRequestDto(Boolean approved) {
        this.approved = approved;
    }

    public Boolean isApproved() {
        return approved != null && approved;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }
}
