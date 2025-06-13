use poise::serenity_prelude::{ButtonStyle, CreateActionRow, CreateButton};

pub fn generate_yes_no_buttons() -> Vec<CreateActionRow> {
    vec![CreateActionRow::Buttons(vec![
        CreateButton::new("yes")
            .label("Yes")
            .style(ButtonStyle::Danger),
        CreateButton::new("no")
            .label("No")
            .style(ButtonStyle::Primary),
    ])]
}
