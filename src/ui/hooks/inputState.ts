import { useState, useEffect } from "react";

function pushButtonBus() {
    const [buttons, setButtons] = useState({
        RIGHT_BTN:  false,
        DOWN_BTN:   false,
        UP_BTN:     false,
        LEFT_BTN:   false,
        ENTER_BNT:  false,
        RETURN_BTN: false,
        ON_OFF_BNT: false
    });

    useEffect(() => {
        (window as any).electron.onPushButtonChange((state: number) => {
            setButtons({
                RIGHT_BTN:  (state & 0b0001) !== 0,
                DOWN_BTN:   (state & 0b0010) !== 0,
                UP_BTN:     (state & 0b0100) !== 0,
                LEFT_BTN:   (state & 0b1000) !== 0,
                ENTER_BNT:  (state & 0b1100) !== 0,
                RETURN_BTN: (state & 0b0011) !== 0,
                ON_OFF_BNT: (state & 0b1111) !== 0
            });
        });
    }, []);

    return buttons;
}

function switchBus() {
    const [switchs, setSwitchs] = useState({
        switch0:   false,
        switch1:   false,
        switch2:   false,
        switch3:   false,
        switch4:   false,
        switch5:   false,
        switch6:   false,
        switch7:   false,
        switch8:   false,
        switch9:   false,
        switch10:  false,
        switch11:  false,
        switch12:  false,
        switch13:  false,
        switch14:  false,
        switch15:  false,
        switch16:  false,
        switch17:  false,
    });


    useEffect(() =>{
        (window as any).electron.onSwitchChange( (state: number) => {
            setSwitchs({
                switch0:  (state & 0b000000000000000001) !== 0,
                switch1:  (state & 0b000000000000000010) !== 0,
                switch2:  (state & 0b000000000000000100) !== 0,
                switch3:  (state & 0b000000000000001000) !== 0,
                switch4:  (state & 0b000000000000010000) !== 0,
                switch5:  (state & 0b000000000000100000) !== 0,
                switch6:  (state & 0b000000000001000000) !== 0,
                switch7:  (state & 0b000000000010000000) !== 0,
                switch8:  (state & 0b000000000100000000) !== 0,
                switch9:  (state & 0b000000001000000000) !== 0,
                switch10: (state & 0b000000010000000000) !== 0,
                switch11: (state & 0b000000100000000000) !== 0,
                switch12: (state & 0b000001000000000000) !== 0,
                switch13: (state & 0b000010000000000000) !== 0,
                switch14: (state & 0b000100000000000000) !== 0,
                switch15: (state & 0b001000000000000000) !== 0,
                switch16: (state & 0b010000000000000000) !== 0,
                switch17: (state & 0b100000000000000000) !== 0,
            });
        });
    });

    return switchs;
}

export { pushButtonBus, switchBus }