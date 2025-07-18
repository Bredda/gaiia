import { AgbChat } from "../components/agb-chat";
import { AgbConfigurator } from "../components/agb-configurator";

export default function AiGotBeefRun() {
  return (
    <div className="flex h-full w-full items-start justify-center gap-4 pt-8">
      <AgbConfigurator className="maw-w-fit" />
      <AgbChat className="flex-1" />
    </div>
  );
}
