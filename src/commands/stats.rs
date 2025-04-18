use crate::commands::common::macros::ok_or_respond;

use crate::Context;
use anyhow::Error;

/// Get event stats for user
#[poise::command(slash_command, rename = "stats")]
pub async fn get_stats(
    ctx: Context<'_>,
    #[description = "Website username OR steamID64"] who: String,
) -> Result<(), Error> {
    let user = ok_or_respond!(
        ctx,
        ctx.data().fp_db_client.find_one_user(&who).await,
        "An error occurred while fetching the user"
    );

    if user.is_none() {
        ctx.say("User not found").await?;
        return Ok(());
    }

    let user = user.unwrap();

    let attendance = ok_or_respond!(
        ctx,
        ctx.data()
            .fp_db_client
            .count_user_attendance(&user.steam_id)
            .await,
        "An error occurred while fetching the user attendance"
    );

    let time = chrono::DateTime::from_timestamp_millis(user.created_at.timestamp_millis())
        .unwrap()
        .format("%Y-%m-%d");

    let text = format!(
        "{} joined on the {} and has registered for {} events",
        user.name, time, attendance
    );

    ctx.say(text).await?;

    Ok(())
}
