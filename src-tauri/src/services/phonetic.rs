const IPA_MAP: &[(&str, &str)] = &[
    ("iː", "衣"),
    ("ɪ", "一"),
    ("e", "诶"),
    ("æ", "哎"),
    ("ɑː", "阿"),
    ("ɒ", "奥"),
    ("ɔː", "哦"),
    ("ʊ", "乌"),
    ("uː", "乌"),
    ("ʌ", "啊"),
    ("ɜː", "额"),
    ("ə", "额"),
    ("eɪ", "诶"),
    ("aɪ", "爱"),
    ("ɔɪ", "哦伊"),
    ("aʊ", "奥"),
    ("əʊ", "欧"),
    ("ɪə", "一额"),
    ("eə", "诶额"),
    ("ʊə", "乌额"),
    ("tʃ", "吃"),
    ("dʒ", "吉"),
    ("p", "泼"),
    ("b", "波"),
    ("t", "特"),
    ("d", "得"),
    ("k", "克"),
    ("ɡ", "格"),
    ("f", "夫"),
    ("v", "夫"),
    ("s", "斯"),
    ("z", "兹"),
    ("m", "摸"),
    ("n", "呢"),
    ("ŋ", "嗯"),
    ("l", "了"),
    ("r", "若"),
    ("j", "一"),
    ("w", "乌"),
    ("h", "喝"),
    ("θ", "[θ咬舌送气]"),
    ("ð", "[ð咬舌浊音]"),
    ("ʃ", "时"),
    ("ʒ", "日"),
];

// IPA 到拼音的映射表
const IPA_TO_PINYIN: &[(&str, &str)] = &[
    ("iː", "yi"),
    ("ɪ", "i"),
    ("e", "ei"),
    ("æ", "ai"),
    ("ɑː", "a"),
    ("ɒ", "ao"),
    ("ɔː", "ao"),
    ("ʊ", "u"),
    ("uː", "wu"),
    ("ʌ", "a"),
    ("ɜː", "er"),
    ("ə", "e"),
    ("eɪ", "ei"),
    ("aɪ", "ai"),
    ("ɔɪ", "oi"),
    ("aʊ", "ao"),
    ("əʊ", "ou"),
    ("ɪə", "ie"),
    ("eə", "ea"),
    ("ʊə", "ue"),
    ("tʃ", "ch"),
    ("dʒ", "j"),
    ("p", "p"),
    ("b", "b"),
    ("t", "t"),
    ("d", "d"),
    ("k", "k"),
    ("ɡ", "g"),
    ("f", "f"),
    ("v", "v"),
    ("s", "s"),
    ("z", "z"),
    ("m", "m"),
    ("n", "n"),
    ("ŋ", "ng"),
    ("l", "l"),
    ("r", "r"),
    ("j", "y"),
    ("w", "w"),
    ("h", "h"),
    ("θ", "th"),
    ("ð", "dh"),
    ("ʃ", "sh"),
    ("ʒ", "zh"),
];

pub fn to_chinese_hint(phonetic: &str) -> String {
    let sanitized = phonetic
        .trim_matches('/')
        .replace(['ˈ', 'ˌ', '\'', '\u{2018}', '\u{2019}'], "") // 移除重音符号和引号
        .replace(' ', "");

    let chars: Vec<char> = sanitized.chars().collect();
    let mut index = 0;
    let mut parts = Vec::new();

    while index < chars.len() {
        let mut matched = false;

        // 尝试匹配 3/2/1 个字符的组合
        for size in [3, 2, 1] {
            if index + size > chars.len() {
                continue;
            }

            let token: String = chars[index..index + size].iter().collect();
            if let Some((_, mapped)) = IPA_MAP.iter().find(|(ipa, _)| *ipa == token) {
                parts.push((*mapped).to_string());
                index += size;
                matched = true;
                break;
            }
        }

        // 未匹配的字符跳过，不显示
        if !matched {
            index += 1;
        }
    }

    if parts.is_empty() {
        return "暂无音标谐音".to_string();
    }

    parts.join(" · ")
}

pub fn to_pinyin_hint(phonetic: &str) -> String {
    let sanitized = phonetic
        .trim_matches('/')
        .replace(['ˈ', 'ˌ', '\'', '\u{2018}', '\u{2019}'], "") // 移除重音符号和引号
        .replace(' ', "");

    let chars: Vec<char> = sanitized.chars().collect();
    let mut index = 0;
    let mut parts = Vec::new();

    while index < chars.len() {
        let mut matched = false;

        // 尝试匹配 3/2/1 个字符的组合
        for size in [3, 2, 1] {
            if index + size > chars.len() {
                continue;
            }

            let token: String = chars[index..index + size].iter().collect();
            if let Some((_, mapped)) = IPA_TO_PINYIN.iter().find(|(ipa, _)| *ipa == token) {
                parts.push((*mapped).to_string());
                index += size;
                matched = true;
                break;
            }
        }

        // 未匹配的字符跳过，不显示
        if !matched {
            index += 1;
        }
    }

    if parts.is_empty() {
        return "".to_string();
    }

    parts.join("-")
}
