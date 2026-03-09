pub fn split_identifier(text: &str) -> Vec<String> {
    if text.trim().is_empty() || text.chars().any(char::is_whitespace) {
        return Vec::new();
    }

    let chars: Vec<char> = text.chars().collect();
    let mut normalized = String::with_capacity(text.len() + 8);

    for (index, character) in chars.iter().copied().enumerate() {
        let previous = index.checked_sub(1).and_then(|current| chars.get(current)).copied();
        let next = chars.get(index + 1).copied();

        if matches!(character, '_' | '-' | '/' | '.') {
            if !normalized.ends_with(' ') {
                normalized.push(' ');
            }
            continue;
        }

        if character.is_ascii_digit() {
            if !normalized.ends_with(' ') {
                normalized.push(' ');
            }
            continue;
        }

        if character.is_ascii_uppercase() {
            if let Some(previous_char) = previous {
                let acronym_boundary = previous_char.is_ascii_uppercase()
                    && matches!(next, Some(next_char) if next_char.is_ascii_lowercase());
                if previous_char.is_ascii_lowercase()
                    || previous_char.is_ascii_digit()
                    || acronym_boundary
                {
                    normalized.push(' ');
                }
            }

            normalized.push(character.to_ascii_lowercase());
            continue;
        }

        normalized.push(character.to_ascii_lowercase());
    }

    normalized
        .split_whitespace()
        .filter(|segment| segment.chars().all(|character| character.is_ascii_alphabetic()))
        .map(ToOwned::to_owned)
        .collect()
}

pub fn looks_like_identifier(text: &str) -> bool {
    if text.trim().is_empty() || text.chars().any(char::is_whitespace) {
        return false;
    }

    let has_separator = text.chars().any(|character| matches!(character, '_' | '-' | '/' | '.'));
    let has_camel_case = text
        .chars()
        .zip(text.chars().skip(1))
        .any(|(left, right)| left.is_ascii_lowercase() && right.is_ascii_uppercase());

    has_separator || has_camel_case || split_identifier(text).len() > 1
}
