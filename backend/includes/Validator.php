<?php
/**
 * Validation Helper Class
 */

class Validator {
    private array $errors = [];
    private array $data;

    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Validate required fields
     */
    public function required(array $fields): self {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
                $this->errors[$field] = ucfirst($field) . ' is required';
            }
        }
        return $this;
    }

    /**
     * Validate email format
     */
    public function email(string $field): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = 'Invalid email format';
        }
        return $this;
    }

    /**
     * Validate minimum length
     */
    public function minLength(string $field, int $length): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field] = ucfirst($field) . " must be at least $length characters";
        }
        return $this;
    }

    /**
     * Validate maximum length
     */
    public function maxLength(string $field, int $length): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field] = ucfirst($field) . " must not exceed $length characters";
        }
        return $this;
    }

    /**
     * Validate exact length
     */
    public function length(string $field, int $length): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) !== $length) {
            $this->errors[$field] = ucfirst($field) . " must be exactly $length characters";
        }
        return $this;
    }

    /**
     * Validate numeric value
     */
    public function numeric(string $field): self {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = ucfirst($field) . ' must be a number';
        }
        return $this;
    }

    /**
     * Validate integer value
     */
    public function integer(string $field): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
            $this->errors[$field] = ucfirst($field) . ' must be an integer';
        }
        return $this;
    }

    /**
     * Validate value is in array
     */
    public function in(string $field, array $values): self {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $this->errors[$field] = ucfirst($field) . ' must be one of: ' . implode(', ', $values);
        }
        return $this;
    }

    /**
     * Validate phone number
     */
    public function phone(string $field): self {
        if (isset($this->data[$field])) {
            $phone = preg_replace('/[^0-9+]/', '', $this->data[$field]);
            if (strlen($phone) < 10 || strlen($phone) > 15) {
                $this->errors[$field] = 'Invalid phone number';
            }
        }
        return $this;
    }

    /**
     * Check if validation passed
     */
    public function passes(): bool {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool {
        return !$this->passes();
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array {
        return $this->errors;
    }

    /**
     * Get validated data
     */
    public function getData(): array {
        return $this->data;
    }

    /**
     * Get specific field value
     */
    public function get(string $field, $default = null) {
        return $this->data[$field] ?? $default;
    }
}
