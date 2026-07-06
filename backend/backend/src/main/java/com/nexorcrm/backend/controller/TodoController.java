package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.Todo;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.TodoRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/todos")
public class TodoController {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    public TodoController(TodoRepository todoRepository, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
    }

    private User getActor(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String principal = authentication.getName();
        return principal.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
                : userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping
    public List<Todo> list(Authentication authentication) {
        User actor = getActor(authentication);
        return todoRepository.findByUserIdOrderByCreatedAtDesc(actor.getId());
    }

    @PostMapping
    public Todo create(@RequestBody Todo request, Authentication authentication) {
        User actor = getActor(authentication);
        Todo todo = new Todo();
        todo.setTitle(request.getTitle());
        todo.setIsCompleted(request.getIsCompleted() != null && request.getIsCompleted());
        todo.setPriority(request.getPriority());
        todo.setDueDate(request.getDueDate());
        todo.setUserId(actor.getId());
        return todoRepository.save(todo);
    }

    @PutMapping("/{id}")
    public Todo update(@PathVariable("id") Long id, @RequestBody Todo request, Authentication authentication) {
        User actor = getActor(authentication);
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
        if (!todo.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (request.getTitle() != null) todo.setTitle(request.getTitle());
        if (request.getIsCompleted() != null) todo.setIsCompleted(request.getIsCompleted());
        if (request.getPriority() != null) todo.setPriority(request.getPriority());
        if (request.getDueDate() != null) todo.setDueDate(request.getDueDate());
        return todoRepository.save(todo);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id, Authentication authentication) {
        User actor = getActor(authentication);
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
        if (!todo.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        todoRepository.delete(todo);
    }
}
