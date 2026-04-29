import { Chatbot } from "@/components/Chatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Smart Bank — <span className="text-transparent bg-clip-text bg-gradient-primary">Aria</span> Chatbot
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Click the chat button at the bottom-right to ask Aria anything about your account, deposits, transfers, fees, or security.
        </p>
      </main>
      <Chatbot />
    </div>
  );
};

export default Index;
