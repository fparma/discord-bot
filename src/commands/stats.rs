use crate::commands::common::macros::ok_or_respond_with_error;

use crate::commands::common::error::command_error::CommandError;
use crate::Context;
use anyhow::Error;

/// Get event stats for user
#[poise::command(slash_command, rename = "stats")]
pub async fn get_stats(
    ctx: Context<'_>,
    #[description = "Website username OR steamID64"] who: String,
) -> Result<(), Error> {
    ok_or_respond_with_error!(ctx, do_stats(ctx, who).await);

    Ok(())
}

async fn do_stats(ctx: Context<'_>, who: String) -> Result<(), CommandError> {
    let user = ctx.data().fp_db_client.find_one_user(&who).await?;

    if user.is_none() {
        ctx.say("User not found").await?;
        return Ok(());
    }

    let user = user.unwrap();

    let attendance = ctx
        .data()
        .fp_db_client
        .count_user_attendance(&user.steam_id)
        .await?;

    let event_number = ctx
        .data()
        .fp_db_client
        .get_user_event_number(&user.name)
        .await?;

    let time = chrono::DateTime::from_timestamp_millis(user.created_at.timestamp_millis())
        .unwrap()
        .format("%Y-%m-%d");

    let mut text = format!(
        "{} joined on the {} and has registered for {} events",
        user.name, time, attendance
    );

    if event_number > 0 {
        text.push_str(&format!(", and has authored about {} events", event_number));
    }

    ctx.say(text).await?;

    Ok(())
}
