macro_rules! ok_or_respond {
    ($ctx:expr, $func:expr, $msg:expr) => {
        match $func {
            Ok(val) => val,
            Err(e) => {
                tracing::error!("Error while executing command: {e}");
                $ctx.say($msg).await?;
                return Ok(());
            }
        }
    };
}

macro_rules! ok_or_respond_with_error {
    ($ctx:expr, $func:expr) => {
        match $func {
            Ok(val) => val,
            Err(e) => {
                tracing::error!("Error while executing command: {e}");
                $ctx.say(e.to_string()).await?;
                return Ok(());
            }
        }
    };
}

pub(crate) use ok_or_respond;
pub(crate) use ok_or_respond_with_error;
