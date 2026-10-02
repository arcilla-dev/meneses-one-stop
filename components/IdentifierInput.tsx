type IdentifierInputProps = {
  uniqueIdentifier: string;
  inputLabel: string;
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  shadowDirection: "left" | "mid" | "right";
  children?: React.ReactNode;
};

export default function IdentifierInput({
  uniqueIdentifier,
  inputLabel,
  id,
  type,
  value,
  onChange,
  placeholder,
  shadowDirection,
  children,
}: IdentifierInputProps){

  const shadowDirectionClass = {
    left: "shadow-[-10px_5px_0px_0px_rgba(68,55,96,1),-15px_10px_4px_0px_rgba(0,0,0,0.25)]",
    mid: "shadow-[0px_5px_0px_0px_rgba(68,55,96,1),0px_10px_4px_0px_rgba(0,0,0,0.25)]",
    right: "shadow-[10px_5px_0px_0px_rgba(68,55,96,1),15px_10px_4px_0px_rgba(0,0,0,0.25)]",
  }[shadowDirection];

  return(
    <div className="flex w-full flex-col">
      <label htmlFor={uniqueIdentifier}>{`${inputLabel}`}</label>
      <div className="relative mt-[1vh]">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            h-[clamp(2.75rem,5vh,4rem)] w-full
            rounded-[10px] border-none bg-[#C48AB2]
            pl-5 pr-14 text-[#443760] outline-none
            text-[clamp(1rem,1.2vw,1.5rem)]
            font-['Times_New_Roman']
            ${shadowDirectionClass}
          `}
        />
          {children}
      </div>
    </div>
  );
}