import RiddleForm from "../components/RiddleForm";
import SayingForm from "../components/SayingForm";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <RiddleForm />
        </div>
        <div>
          <SayingForm />
        </div>
      </div>
    </div>
  );
}
