import React from "react";

// eslint-disable-next-line max-len
const wotcDisclaimer = `Magic: The Griddening is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. \u00A9Wizards of the Coast LLC.`;

export default function Footer(): React.JSX.Element {
  return (
    <div className="mt-8 mb-4 mx-auto max-w-2xl px-4">
      <div className="border-t border-gold-leaf/20 pt-4">
        <p className="text-text-parchment/50 text-xs md:text-sm font-[family-name:var(--font-body)] text-center leading-relaxed">
          {wotcDisclaimer}
        </p>
      </div>
    </div>
  );
}
