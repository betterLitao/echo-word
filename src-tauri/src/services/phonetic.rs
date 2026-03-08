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

pub fn to_chinese_hint(phonetic: &str) -> String {
    let sanitized = phonetic
        .trim_matches('/')
        .replace(['ˈ', 'ˌ'], "")
        .replace(' ', "");

    let chars: Vec<char> = sanitized.chars().collect();
    let mut index = 0;
    let mut parts = Vec::new();

    while index < chars.len() {
        let mut matched = false;

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

        if !matched {
            parts.push(chars[index].to_string());
            index += 1;
        }
    }

    parts.join(" · ")
}
