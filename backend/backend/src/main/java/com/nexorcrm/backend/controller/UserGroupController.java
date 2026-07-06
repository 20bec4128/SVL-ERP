package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.CreateUserGroupRequest;
import com.nexorcrm.backend.dto.UserGroupAssignableTeamResponse;
import com.nexorcrm.backend.dto.UserGroupAssignableUserResponse;
import com.nexorcrm.backend.dto.UserGroupMemberResponse;
import com.nexorcrm.backend.dto.UpdateUserGroupRequest;
import com.nexorcrm.backend.dto.UpdateUserGroupMemberPagesRequest;
import com.nexorcrm.backend.dto.UserGroupResponse;
import com.nexorcrm.backend.service.UserGroupService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user-groups")
public class UserGroupController {

    private final UserGroupService userGroupService;

    public UserGroupController(UserGroupService userGroupService) {
        this.userGroupService = userGroupService;
    }

    @GetMapping
    public List<UserGroupResponse> listGroups(Authentication authentication) {
        return userGroupService.listGroups(authentication.getName());
    }

    @PostMapping
    public UserGroupResponse createGroup(@Valid @RequestBody CreateUserGroupRequest request, Authentication authentication) {
        return userGroupService.createGroup(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public UserGroupResponse updateGroup(@PathVariable("id") Long id,
                                         @Valid @RequestBody UpdateUserGroupRequest request,
                                         Authentication authentication) {
        return userGroupService.updateGroup(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteGroup(@PathVariable("id") Long id, Authentication authentication) {
        userGroupService.deleteGroup(id, authentication.getName());
    }

    @GetMapping("/assignable-users")
    public List<UserGroupAssignableUserResponse> listAssignableUsers(
            @RequestParam(value = "groupId", required = false) Long groupId,
            @RequestParam(value = "teams", required = false) List<String> teams,
            @RequestParam(value = "institutionName", required = false) String institutionName,
            @RequestParam(value = "departmentNames", required = false) List<String> departmentNames,
            @RequestParam(value = "memberScope", required = false) String memberScope,
            Authentication authentication
    ) {
        return userGroupService.listAssignableUsers(
                authentication.getName(),
                groupId,
                teams,
                institutionName,
                departmentNames,
                memberScope
        );
    }

    @GetMapping("/assignable-teams")
    public List<UserGroupAssignableTeamResponse> listAssignableTeams(
            @RequestParam(value = "institutionName", required = false) String institutionName,
            @RequestParam(value = "departmentName", required = false) String departmentName,
            Authentication authentication
    ) {
        return userGroupService.listAssignableTeams(
                authentication.getName(),
                institutionName,
                departmentName
        );
    }

    @GetMapping("/my-visibility")
    public List<String> listMyVisibility(Authentication authentication) {
        return userGroupService.listMyVisiblePageKeys(authentication.getName());
    }

    @GetMapping("/{id}/members")
    public List<UserGroupMemberResponse> listGroupMembers(@PathVariable("id") Long id, Authentication authentication) {
        return userGroupService.listGroupMembers(id, authentication.getName());
    }

    @PostMapping("/{id}/members")
    public List<UserGroupMemberResponse> addGroupMember(@PathVariable("id") Long id,
                                                        @RequestParam("userId") Long userId,
                                                        Authentication authentication) {
        return userGroupService.addGroupMember(id, userId, authentication.getName());
    }

    @DeleteMapping("/{id}/members/{userId}")
    public List<UserGroupMemberResponse> removeGroupMember(@PathVariable("id") Long id,
                                                           @PathVariable("userId") Long userId,
                                                           Authentication authentication) {
        return userGroupService.removeGroupMember(id, userId, authentication.getName());
    }

    @PutMapping("/{id}/members/{userId}/pages")
    public List<UserGroupMemberResponse> updateGroupMemberPages(@PathVariable("id") Long id,
                                                                @PathVariable("userId") Long userId,
                                                                @RequestBody UpdateUserGroupMemberPagesRequest request,
                                                                Authentication authentication) {
        return userGroupService.updateMemberPageVisibility(id, userId, request, authentication.getName());
    }
}
