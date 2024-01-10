import React from 'react';

// eslint-disable-next-line max-len
const wotcDisclaimer = `Magic: The Griddening is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.`

export default function Footer(): React.JSX.Element{
    return (
        <div>
            <p>{wotcDisclaimer}</p>
        </div>
    )
}