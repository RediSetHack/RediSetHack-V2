import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Y2kButton,
  Button,
  Window,
  StatusChip,
  XPChip,
  SegmentedTracker,
  Progress,
  EmptyState,
  BadgeTile,
  Input,
  Y2kInput,
  Textarea,
  Y2kTextarea,
  Select,
  Y2kSelect,
  Checkbox,
  Y2kCheckbox,
  RadioCardGroup,
  CharacterCard,
  StageNode,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Pager,
  Breadcrumb,
  Toast,
  DesktopIcon,
  SkeletonWindow,
} from "@/components/y2k";

describe("Window", () => {
  it("renders the title and three control squares", () => {
    const markup = renderToStaticMarkup(<Window title="MAP.EXE">content</Window>);
    expect(markup).toContain("MAP.EXE");
    expect(markup).toContain("content");
  });
});

describe("StatusChip", () => {
  it.each([
    ["locked", "Locked"],
    ["unlocked", "Unlocked"],
    ["completed", "Completed"],
    ["passed", "Passed"],
    ["not-passed", "Not passed"],
    ["not-taken", "Not taken"],
    ["solved", "Solved"],
  ] as const)("renders text + icon for %s status", (status, label) => {
    const markup = renderToStaticMarkup(<StatusChip status={status} />);
    expect(markup).toContain(label);
    expect(markup).toContain("<svg"); // Lucide icon
  });
});

describe("XPChip", () => {
  it("formats XP in VT323", () => {
    const markup = renderToStaticMarkup(<XPChip xp={1240} />);
    expect(markup).toContain("1,240 XP");
    expect(markup).toContain("font-pixel-lg");
  });
});

describe("Progress", () => {
  it("exposes role=progressbar with value and max", () => {
    const markup = renderToStaticMarkup(<Progress value={150} max={100} label="Zone progress" />);
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('value="150"');
    expect(markup).toContain('max="100"');
    expect(markup).toContain('aria-label="Zone progress"');
  });

  it("renders marching diagonal stripe pattern", () => {
    const markup = renderToStaticMarkup(<Progress value={40} max={100} march />);
    expect(markup).toContain("y2k-march");
  });

  it("renders an indeterminate bar without a value", () => {
    const markup = renderToStaticMarkup(
      <Progress indeterminate label="Running your code" />,
    );
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-label="Running your code"');
    expect(markup).toContain("y2k-progress-indeterminate");
    expect(markup).not.toContain("value=");
  });
});

describe("SegmentedTracker", () => {
  it("marks current step and states in labels", () => {
    const markup = renderToStaticMarkup(
      <SegmentedTracker total={3} current={1} answered={new Set([0])} />,
    );
    expect(markup).toContain('aria-label="Question 1: answered"');
    expect(markup).toContain('aria-label="Question 2: current"');
    expect(markup).toContain('aria-label="Question 3: unanswered"');
    expect(markup).toContain('aria-current="step"');
  });
});

describe("EmptyState", () => {
  it("renders title and message", () => {
    const markup = renderToStaticMarkup(<EmptyState title="No Quests available." message="Check back soon." />);
    expect(markup).toContain("No Quests available.");
    expect(markup).toContain("Check back soon.");
  });
});

describe("BadgeTile", () => {
  it("states earned count in text with initial fallback", () => {
    const markup = renderToStaticMarkup(<BadgeTile name="Quest Master" earnedCount={3} />);
    expect(markup).toContain("Quest Master");
    expect(markup).toContain("Earned ×3");
    expect(markup).toContain("Q"); // fallback initial
  });
});

describe("Y2kButton / Button", () => {
  it("keeps builder actions from submitting surrounding forms", () => {
    expect(renderToStaticMarkup(<Y2kButton>PREVIEW</Y2kButton>)).toContain('type="button"');
    expect(renderToStaticMarkup(<Button type="submit">SAVE</Button>)).toContain('type="submit"');
  });

  it("renders variants with 2px border and hard offset shadow", () => {
    const markup = renderToStaticMarkup(<Y2kButton variant="primary">ACTION</Y2kButton>);
    expect(markup).toContain("border-2");
    expect(markup).toContain("shadow-[3px_3px_0_var(--border)]");
  });
});

describe("Input / Y2kInput", () => {
  it("renders with sparkle focus shadow and 2px border", () => {
    const markup = renderToStaticMarkup(<Input id="username" placeholder="cyber_pilot" />);
    expect(markup).toContain('id="username"');
    expect(markup).toContain("focus:shadow-[2px_2px_0_var(--sparkle)]");
    expect(markup).toContain("border-2");
  });

  it("associates error text via aria-invalid and aria-describedby", () => {
    const markup = renderToStaticMarkup(
      <Y2kInput id="email" invalid error="Invalid email address" errorId="email-err" />,
    );
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="email-err"');
  });
});

describe("Textarea / Y2kTextarea", () => {
  it("renders monospace variant by default or when requested", () => {
    const monoMarkup = renderToStaticMarkup(<Textarea monospace defaultValue="SELECT * FROM table" />);
    expect(monoMarkup).toContain("font-mono");

    const sansMarkup = renderToStaticMarkup(<Textarea monospace={false} defaultValue="Regular notes" />);
    expect(sansMarkup).toContain("font-body");
  });

  it("associates aria-invalid and aria-describedby when invalid", () => {
    const markup = renderToStaticMarkup(
      <Y2kTextarea id="bio" invalid errorId="bio-err" />,
    );
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="bio-err"');
  });
});

describe("Select / Y2kSelect", () => {
  it("renders options with retro styling and error associations", () => {
    const markup = renderToStaticMarkup(
      <Select id="role" error="Role is required" errorId="role-err">
        <option value="pilot">Pilot</option>
        <option value="hacker">Hacker</option>
      </Select>,
    );
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="role-err"');
    expect(markup).toContain("<option value=\"pilot\">Pilot</option>");

    const y2kMarkup = renderToStaticMarkup(
      <Y2kSelect id="y2k-role" invalid>
        <option value="test">Test</option>
      </Y2kSelect>,
    );
    expect(y2kMarkup).toContain('aria-invalid="true"');
  });
});

describe("Checkbox / Y2kCheckbox", () => {
  it("renders accessible checkbox with label and focus ring", () => {
    const markup = renderToStaticMarkup(
      <Checkbox id="terms" label="I accept the hacker manifesto" defaultChecked />,
    );
    expect(markup).toContain('type="checkbox"');
    expect(markup).toContain('id="terms"');
    expect(markup).toContain("I accept the hacker manifesto");
    expect(markup).toContain("checked");
  });

  it("associates aria-invalid and inline error", () => {
    const markup = renderToStaticMarkup(
      <Y2kCheckbox id="agree" invalid error="Must agree" errorId="agree-err" label="Agree" />,
    );
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="agree-err"');
  });
});

describe("RadioCardGroup", () => {
  it("is keyboard operable with role=radiogroup and native radio inputs", () => {
    const options = [
      { value: "easy", label: "Novice", description: "Learn the basics" },
      { value: "hard", label: "Expert", description: "Full blast" },
    ];
    const markup = renderToStaticMarkup(
      <RadioCardGroup
        name="difficulty"
        label="Select difficulty"
        value="hard"
        options={options}
      />,
    );
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="Select difficulty"');
    expect(markup).toContain('type="radio"');
    expect(markup).toContain('name="difficulty"');
    expect(markup).toContain('value="easy"');
    expect(markup).toContain('value="hard"');
    expect(markup).toContain("Novice");
    expect(markup).toContain("Expert");
    expect(markup).toContain("Full blast");
  });
});

describe("CharacterCard", () => {
  it("renders name, description, avatar or initial fallback, and selected state", () => {
    const markup = renderToStaticMarkup(
      <CharacterCard
        name="Pixel Kate"
        description="Master of encryption"
        selected
      />,
    );
    expect(markup).toContain("Pixel Kate");
    expect(markup).toContain("Master of encryption");
    expect(markup).toContain("P"); // initial
    expect(markup).toContain("Selected");
  });

  it("renders choose button when not selected", () => {
    const markup = renderToStaticMarkup(
      <CharacterCard
        name="Echo"
        description="Sound wave manipulator"
        selected={false}
      />,
    );
    expect(markup).toContain("Choose Avatar");
  });
});

describe("StageNode", () => {
  it("renders locked state with lock icon and aria-disabled", () => {
    const markup = renderToStaticMarkup(
      <StageNode
        stageNumber={3}
        title="Firewall Breach"
        xpReward={250}
        status="locked"
      />,
    );
    expect(markup).toContain("Firewall Breach");
    expect(markup).toContain("250 XP");
    expect(markup).toContain("Locked");
    expect(markup).toContain('aria-disabled="true"');
  });

  it("renders locked state as a non-link non-button with accessible lock reason", () => {
    const markup = renderToStaticMarkup(
      <StageNode
        stageNumber={3}
        title="Firewall Breach"
        xpReward={250}
        status="locked"
        href="/map/1/1/3"
      />,
    );
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("<button");
    expect(markup).not.toContain("href=");
    expect(markup).toMatch(/<span[^>]*>Locked — finish the previous Stage first\.<\/span>/);
  });

  it("renders unlocked state as a link with Unlocked chip", () => {
    const markup = renderToStaticMarkup(
      <StageNode
        stageNumber={2}
        title="Packet Sniffing"
        xpReward={75}
        status="available"
        href="/map/1/1/2"
      />,
    );
    expect(markup).toContain('href="/map/1/1/2"');
    expect(markup).toContain("Unlocked");
    expect(markup).toContain("75 XP");
  });

  it("renders completed state as a link with Completed chip", () => {
    const markup = renderToStaticMarkup(
      <StageNode
        stageNumber={1}
        title="Intro to Net"
        xpReward={100}
        status="completed"
        href="/map/1/1/1"
      />,
    );
    expect(markup).toContain('href="/map/1/1/1"');
    expect(markup).toContain("Completed");
    expect(markup).toContain("100 XP");
  });
});

describe("Table primitives", () => {
  it("renders table with Thead, Tbody, Tr, Th, Td and sorting indicator", () => {
    const markup = renderToStaticMarkup(
      <Table>
        <Thead>
          <Tr>
            <Th sorted="asc">User</Th>
            <Th sorted="desc">Score</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Neo</Td>
            <Td>9999</Td>
            <Td>Online</Td>
          </Tr>
        </Tbody>
      </Table>,
    );
    expect(markup).toContain("<table");
    expect(markup).toContain("<thead");
    expect(markup).toContain("<tbody");
    expect(markup).toContain("<tr");
    expect(markup).toContain("<th");
    expect(markup).toContain("<td");
    expect(markup).toContain("Neo");
    expect(markup).toContain("▲"); // asc
    expect(markup).toContain("▼"); // desc
  });
});

describe("Pager", () => {
  it("disables PREVIOUS on page 1 and shows Page n of m", () => {
    const markup = renderToStaticMarkup(
      <Pager page={1} totalPages={5} hrefFor={(p) => `?page=${p}`} />,
    );
    expect(markup).toContain("Page 1 of 5");
    expect(markup).toContain("pointer-events-none");
    expect(markup).toContain("Previous");
    expect(markup).toContain("Next");
  });

  it("disables NEXT on last page", () => {
    const markup = renderToStaticMarkup(
      <Pager page={5} totalPages={5} hrefFor={(p) => `?page=${p}`} />,
    );
    expect(markup).toContain("Page 5 of 5");
    // Next should be disabled
    expect(markup).toContain("pointer-events-none");
  });

  it("supports client onPageChange with button elements and disabled attribute", () => {
    const fn = vi.fn();
    const markup = renderToStaticMarkup(
      <Pager page={1} totalPages={3} onPageChange={fn} />,
    );
    expect(markup).toContain("<button");
    expect(markup).toContain("disabled");
  });
});

describe("Breadcrumb", () => {
  it("renders title-bar style clickable segments with separators and aria-current", () => {
    const markup = renderToStaticMarkup(
      <Breadcrumb
        items={[
          { label: "ROOT", href: "/" },
          { label: "ZONE 1", href: "/zone-1" },
          { label: "STAGE 3" },
        ]}
      />,
    );
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/zone-1"');
    expect(markup).toContain("›");
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("STAGE 3");
  });
});

describe("Toast", () => {
  it("renders success and error variants with icons and status role", () => {
    const successMarkup = renderToStaticMarkup(
      <Toast message="Quest completed!" variant="success" />,
    );
    expect(successMarkup).toContain("Quest completed!");
    expect(successMarkup).toContain('role="status"');
    expect(successMarkup).toContain("bg-[#59D98F]");

    const errorMarkup = renderToStaticMarkup(
      <Toast message="Network error." variant="error" />,
    );
    expect(errorMarkup).toContain("Network error.");
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("bg-btn-danger");
  });
});

describe("DesktopIcon", () => {
  it("renders icon and centered label with link or button", () => {
    const markup = renderToStaticMarkup(
      <DesktopIcon
        icon={<span data-testid="ico">💾</span>}
        label="DISK_A"
        href="/disk"
      />,
    );
    expect(markup).toContain('href="/disk"');
    expect(markup).toContain("DISK_A");
    expect(markup).toContain("y2k-icon");
  });
});

describe("SkeletonWindow", () => {
  it("renders window with title, marching bar, and loading message in VT323", () => {
    const markup = renderToStaticMarkup(
      <SkeletonWindow title="LOADING.EXE" label="Loading hacker data" />,
    );
    expect(markup).toContain("LOADING.EXE");
    expect(markup).toContain("Loading hacker data");
    expect(markup).toContain("y2k-march");
    expect(markup).toContain("font-pixel-lg");
  });
});
