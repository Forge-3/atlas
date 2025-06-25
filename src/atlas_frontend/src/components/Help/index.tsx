import React from "react";

const sections = [
  { id: "eligibility", label: "Eligibility" },
  { id: "responsibilities", label: "Responsibilities" },
  { id: "content-guidelines", label: "Content Guidelines" },
  { id: "intellectual-property", label: "Intellectual Property" },
  { id: "legal-compliance", label: "Legal Compliance" },
  { id: "rewards-disclaimer", label: "Participation & Rewards Disclaimer" },
  { id: "restrictions", label: "Restrictions" },
  { id: "termination", label: "Termination" },
  { id: "data-privacy", label: "Data Privacy" },
];

const Help = () => {
  return (
    <div className="container mx-auto my-12 flex gap-6 scroll-smooth">
      <aside className="w-64 sticky top-12 h-fit bg-gradient-to-b from-[#1E0F33]/80 to-[#9173FF]/10 text-white p-4 rounded-xl font-montserrat font-medium top-28">
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                onClick={() => {
                  window.location.hash = section.id;
                }}
                className="hover:underline"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 space-y-12 text-white font-montserrat">
        <section className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
          <p>
            Atlas is your home to grow, connect, and make a real difference.
            Complete fun and rewarding tasks, earn exclusive perks, and build
            your reputation in one of the most exciting communities in the
            world.
          </p>
          <p>
            Take action, make an impact, and grow as a leader — all while having
            fun and being part of something bigger.
          </p>
        </section>

        <section id="eligibility" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Are 18 years of age or older</li>
            <li>
              Have a demonstrable interest in blockchain, web3, or open internet
              technologies
            </li>
            <li>
              Are actively involved in online or local communities, with a
              passion for sharing knowledge
            </li>
            <li>
              Are aligned with the values of decentralization, transparency, and
              innovation
            </li>
            <li>
              Maintain a professional and positive presence online and in person
            </li>
          </ul>
        </section>

        <section id="responsibilities" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Responsibilities</h2>
          <p>
            As an Atlas Champion, you play a key role in expanding awareness of
            the Internet Computer and helping others discover its potential.
            Champions are expected to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Promote the Internet Computer and the Atlas Program through social
              media platforms by sharing updates, news, and educational content
            </li>
            <li>
              Use official hashtags and tag relevant ICP accounts to amplify
              campaign visibility and reach
            </li>
            <li>
              Create original content, including tutorials, threads, videos,
              blog posts, and event recaps
            </li>
            <li>
              Host or support events such as online AMAs, Twitter/X Spaces,
              workshops, or local meetups
            </li>
            <li>
              Engage with the community, answer questions, and support newcomers
              on forums and social platforms
            </li>
            <li>
              Collaborate with fellow Champions, project teams, and the broader
              ecosystem to build awareness and momentum
            </li>
            <li>
              Provide feedback to the Atlas team on community needs, product
              insights, and opportunities for growth
            </li>
            <li>
              Participation is entirely voluntary — Champions are free to leave
              the program at any time.
            </li>
            <li>
              Rewards can only be earned when active missions are available and
              successfully completed.
            </li>
            <li>
              Missions operate on a first-come, first-served basis and must be
              approved by the mission creator for rewards to be granted.
            </li>
            <li>
              Mission timelines may vary — each mission will have its own
              deadline, requirements, and reward structure.
            </li>
          </ul>
          <p>
            Your voice, creativity, and authenticity are at the core of this
            program — we’re here to support you in growing your impact and
            helping shape the next chapter of the open internet.
          </p>
        </section>

        <section id="content-guidelines" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Content Guidelines</h2>
          <p>
            To maintain the integrity of the Atlas Program and reflect the
            values of the Internet Computer ecosystem, all content shared by
            Champions must adhere to the following guidelines:
          </p>
          <strong className="block mt-2">What We Encourage:</strong>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Authenticity: Share your honest thoughts and personal experiences
              with the Internet Computer and its tools. Original, thoughtful
              content has the most impact.
            </li>
            <li>
              Quality: Create well-written, visually clear, and informative
              content—whether it’s a tweet, video, blog post, or event.
            </li>
            <li>
              Alignment: Ensure your tone, message, and visuals align with the
              values of the Internet Computer: openness, innovation,
              decentralization, and community-first thinking.
            </li>
            <li>
              Proper Attribution: Use official branding assets where
              appropriate, and tag the official Internet Computer accounts when
              relevant.
            </li>
            <li>
              Designated Hashtags: Include program-approved hashtags to help
              amplify your message and connect with the broader community.
            </li>
          </ul>
          <strong className="block mt-4">What to Avoid:</strong>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Inappropriate or harmful content: Any content that promotes hate,
              violence, discrimination, or harassment is strictly prohibited.
            </li>
            <li>
              Misinformation: Do not share speculative or false claims about the
              Internet Computer or its ecosystem.
            </li>
            <li>
              Spam or low-effort posts: Avoid repetitive, clickbait-style
              content or posts designed solely for engagement without value.
            </li>
            <li>
              Unapproved use of logos or trademarks: Do not alter or misuse
              official brand assets.
            </li>
          </ul>
          <strong className="block mt-4">Reminder:</strong>
          <p>
            All content shared as part of the Atlas Champions Program is a
            reflection of the broader community. The program team reserves the
            right to request edits or removal of content that doesn’t meet these
            standards. Repeat violations may result in removal from the program.
          </p>
        </section>

        <section id="intellectual-property" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Intellectual Property</h2>
          <p>
            As an Atlas Champion, the content you create stays yours — but by
            participating in the program, you give the Internet Computer
            ecosystem permission to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Share and showcase your content (with credit) across social media,
              websites, and community campaigns
            </li>
            <li>
              Feature your name or username when highlighting your contributions
            </li>
            <li>
              Use your content to help grow awareness of the Internet Computer
              and support educational efforts
            </li>
          </ul>
          <p>
            This helps amplify your voice while supporting a shared,
            decentralized mission. You’ll always be credited, and your content
            will never be used out of context.
          </p>
        </section>

        <section id="legal-compliance" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Legal Compliance</h2>
          <p>
            All Atlas Champions are expected to follow applicable laws and
            regulations when creating and sharing content. This includes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b>Disclosing partnerships or endorsements</b> clearly when
              promoting the Internet Computer or related projects
            </li>
            <li>
              <b>Respecting intellectual property rights</b>, including proper
              use of logos, trademarks, and third-party content
            </li>
            <li>
              <b>Following platform-specific rules</b> (e.g., Twitter/X,
              YouTube, etc.) for promotions and branded content
            </li>
          </ul>
          <p>
            Staying compliant helps protect both you and the community. If
            you’re unsure about anything, feel free to reach out to the Atlas
            team for guidance.
          </p>
        </section>

        <section id="rewards-disclaimer" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">
            Participation & Rewards Disclaimer
          </h2>
          <p>
            Participation in the Atlas Champions Program is entirely voluntary.
            Champions may choose to leave the program at any time, with no
            obligation or penalty. The Atlas Champions Program is managed by
            [Program Operator/...], and participation is offered on an as-is
            basis. [Operator] shall not be held liable for any loss, damage, or
            consequence resulting from participation in the program, including
            (but not limited to) technical issues, communication delays, or
            third-party content. Rewards under the program are only granted for
            officially issued missions, and:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Are not guaranteed;</li>
            <li>
              Can only be earned upon successful completion of tasks approved by
              the mission creator;
            </li>
            <li>
              Are subject to availability on a first-come, first-served basis;
            </li>
            <li>
              May be tied to missions with varying scopes, durations, and
              deadlines.
            </li>
          </ul>
        </section>

        <section id="restrictions" className="flex gap-4 flex-col scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-2">Restrictions</h2>
          <p>
            To keep the Atlas Champions Program fair, consistent, and aligned
            with the values of the Internet Computer ecosystem, all participants
            must follow these guidelines:
          </p>
          <b>HUB/Community Project Selection</b>
          <ul className="list-disc pl-5 space-y-1">
            <li>Champions may only join one regional HUB</li>
            <li>
              If you choose to switch hubs, your XP points, progress, and
              rewards will reset, and you will need to start over in the new
              hub.
            </li>
            <li>
              This ensures fairness and prevents duplicate participation across
              hubs.
            </li>
          </ul>
          <b>General Restrictions</b>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              No multi-accounting: You may not use multiple identities to earn
              extra XP or rewards.
            </li>
            <li>
              No automated participation: Content, tasks, and contributions must
              be created by you — not bots or AI automation.
            </li>
            <li>
              No plagiarism: All content must be original or properly credited
              when using external sources or media.
            </li>
            <li>
              No manipulation: Do not attempt to game the XP or rewards system
              through spam, fake engagement, or misleading activity.
            </li>
            <li>
              Respect community standards: Harassment, hate speech, or any form
              of harmful behavior will result in removal from the program.
            </li>
            <li>
              No false representation: Champions must not present themselves as
              official team members or make unapproved claims about the Internet
              Computer or its partners.
            </li>
          </ul>
          <p>
            Violations of these rules may result in removal from the Atlas
            Program and forfeiture of any accumulated rewards or privileges.
          </p>
        </section>

        <section id="termination">
          <h2 className="text-2xl font-semibold mb-2">Termination</h2>
          <p>
            By entering the Atlas Program, you acknowledge that participation is
            voluntary and non-binding for both parties. Neither you nor the
            program are under any long-term obligation to one another. You are
            free to participate, complete missions, and contribute to the
            community as you choose. Likewise, you may exit the program at any
            time, for any reason, without penalty. Similarly, the Atlas Program
            reserves the right to discontinue your participation at its
            discretion, with or without notice, if it is determined to be in the
            best interest of the program or its community.
          </p>
        </section>

        <section id="data-privacy">
          <h2 className="text-2xl font-semibold mb-2">Data Privacy</h2>
          <p>
            The Atlas Program is committed to protecting your personal
            information. Any data collected during your participation will be
            used solely for program-related purposes — such as communication,
            rewards, and mission tracking.
          </p>
          <p>
            Your personal information will be stored securely and{" "}
            <b>will not be shared with third parties</b> without your explicit
            consent. We respect your privacy and handle all data in accordance
            with applicable data protection laws.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Help;
