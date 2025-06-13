use poise::CreateReply;

pub fn text_reply(text: &str) -> CreateReply {
    CreateReply::default().content(text).components(vec![])
}
