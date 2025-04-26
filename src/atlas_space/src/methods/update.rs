use crate::{errors::Error, guard::admin_or_owner_guard, memory};
use ic_cdk::update;

#[update]
pub fn set_space_name(name: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_name(name))?;
    Ok(())
}

#[update]
pub fn set_space_description(description: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_description(description))?;
    Ok(())
}

#[update]
pub fn set_space_logo(logo: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_logo(logo))?;
    Ok(())
}

#[update]
pub fn set_space_background(space_background: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_background(space_background))?;
    Ok(())
}

