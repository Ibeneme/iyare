
import React from "react";
import { useToast } from "../Context/ToastProvider";

const AnyComponent = () => {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast("success", "Saved successfully!")}>
        Show Success
      </button>
      <button onClick={() => addToast("error", "Something went wrong!")}>
        Show Error
      </button>
      <button onClick={() => addToast("warning", "Be careful!")}>
        Show Warning
      </button>
    </div>
  );
};

export default AnyComponent;
