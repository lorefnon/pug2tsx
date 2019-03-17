import * as React from "react";

import { MonthView } from "./MonthView";

interface ICalendarProps {
  currentView: "week" | "month" | "year";
  currentDate: Date;
  name: string;
}

export default function Calendar(props: ICalendarProps) {
  return (
    <div id={props.id} className={"calendar-container"}>
      <div className={"calendar-inner"}>
        <MonthView name={props.name} />
      </div>
    </div>
  );
}

