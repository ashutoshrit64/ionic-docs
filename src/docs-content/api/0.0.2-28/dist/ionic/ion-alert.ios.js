/*!
 * (C) Ionic http://ionicframework.com - MIT License
 * Built with http://stenciljs.com
 */
const { h, Context } = window.Ionic;

import { domControllerAsync, playAnimationAsync } from './chunk1.js';
import { createThemedClasses, getClassMap } from './chunk2.js';

const BACKDROP = 'backdrop';

/**
 * iOS Alert Enter Animation
 */
function iosEnterAnimation(Animation, baseEl) {
    const baseAnimation = new Animation();
    const backdropAnimation = new Animation();
    backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'));
    const wrapperAnimation = new Animation();
    wrapperAnimation.addElement(baseEl.querySelector('.alert-wrapper'));
    backdropAnimation.fromTo('opacity', 0.01, 0.3);
    wrapperAnimation.fromTo('opacity', 0.01, 1).fromTo('scale', 1.1, 1);
    const ani = baseAnimation
        .addElement(baseEl)
        .easing('ease-in-out')
        .duration(200)
        .add(backdropAnimation)
        .add(wrapperAnimation);
    return Promise.resolve(ani);
}

/**
 * iOS Alert Leave Animation
 */
function iosLeaveAnimation(Animation, baseEl) {
    const baseAnimation = new Animation();
    const backdropAnimation = new Animation();
    backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'));
    const wrapperAnimation = new Animation();
    wrapperAnimation.addElement(baseEl.querySelector('.alert-wrapper'));
    backdropAnimation.fromTo('opacity', 0.3, 0);
    wrapperAnimation.fromTo('opacity', 0.99, 0).fromTo('scale', 1, 0.9);
    const ani = baseAnimation
        .addElement(baseEl)
        .easing('ease-in-out')
        .duration(200)
        .add(backdropAnimation)
        .add(wrapperAnimation);
    return Promise.resolve(ani);
}

/**
 * Md Alert Enter Animation
 */
function mdEnterAnimation(Animation, baseEl) {
    const baseAnimation = new Animation();
    const backdropAnimation = new Animation();
    backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'));
    const wrapperAnimation = new Animation();
    wrapperAnimation.addElement(baseEl.querySelector('.alert-wrapper'));
    backdropAnimation.fromTo('opacity', 0.01, 0.5);
    wrapperAnimation.fromTo('opacity', 0.01, 1).fromTo('scale', 1.1, 1);
    return Promise.resolve(baseAnimation
        .addElement(baseEl)
        .easing('ease-in-out')
        .duration(200)
        .add(backdropAnimation)
        .add(wrapperAnimation));
}

/**
 * Md Alert Leave Animation
 */
function mdLeaveAnimation(Animation, baseEl) {
    const baseAnimation = new Animation();
    const backdropAnimation = new Animation();
    backdropAnimation.addElement(baseEl.querySelector('ion-backdrop'));
    const wrapperAnimation = new Animation();
    wrapperAnimation.addElement(baseEl.querySelector('.alert-wrapper'));
    backdropAnimation.fromTo('opacity', 0.5, 0);
    wrapperAnimation.fromTo('opacity', 0.99, 0).fromTo('scale', 1, 0.9);
    return Promise.resolve(baseAnimation
        .addElement(baseEl)
        .easing('ease-in-out')
        .duration(200)
        .add(backdropAnimation)
        .add(wrapperAnimation));
}

class Alert {
    constructor() {
        this.animation = null;
        this.inputType = null;
        /**
         * Array of buttons to be added to the alert.
         */
        this.buttons = [];
        /**
         * Array of input to show in the alert.
         */
        this.inputs = [];
        /**
         * If true, the alert will be dismissed when the backdrop is clicked. Defaults to `true`.
         */
        this.enableBackdropDismiss = true;
        /**
         * If true, the alert will be translucent. Defaults to `false`.
         */
        this.translucent = false;
        /**
         * If true, the alert will animate. Defaults to `true`.
         */
        this.willAnimate = true;
    }
    componentDidLoad() {
        this.ionAlertDidLoad.emit();
    }
    componentDidEnter() {
        this.ionAlertDidPresent.emit();
    }
    componentDidUnload() {
        this.ionAlertDidUnload.emit();
    }
    onBackdropTap() {
        this.dismiss(null, BACKDROP);
    }
    /**
     * Present the alert overlay after it has been created.
     */
    present() {
        this.ionAlertWillPresent.emit();
        this.el.style.zIndex = `${20000 + this.alertId}`;
        // get the user's animation fn if one was provided
        const animationBuilder = this.enterAnimation || this.config.get('alertEnter', this.mode === 'ios' ? iosEnterAnimation : mdEnterAnimation);
        // build the animation and kick it off
        return this.playAnimation(animationBuilder).then(() => {
            const firstInput = this.el.querySelector('[tabindex]');
            if (firstInput) {
                firstInput.focus();
            }
            this.ionAlertDidPresent.emit();
        });
    }
    /**
     * Dismiss the alert overlay after it has been presented.
     */
    dismiss(data, role) {
        this.ionAlertWillDismiss.emit({ data, role });
        // get the user's animation fn if one was provided
        const animationBuilder = this.leaveAnimation || this.config.get('alertLeave', this.mode === 'ios' ? iosLeaveAnimation : mdLeaveAnimation);
        return this.playAnimation(animationBuilder).then(() => {
            return domControllerAsync(this.dom.write, () => {
                this.el.parentNode.removeChild(this.el);
            });
        });
    }
    rbClick(inputIndex) {
        this.inputs = this.inputs.map((input, index) => {
            input.checked = (inputIndex === index);
            return input;
        });
        const rbButton = this.inputs[inputIndex];
        this.activeId = rbButton.id;
        if (rbButton.handler) {
            rbButton.handler(rbButton);
        }
    }
    cbClick(inputIndex) {
        this.inputs = this.inputs.map((input, index) => {
            if (inputIndex === index) {
                input.checked = !input.checked;
            }
            return input;
        });
        const cbButton = this.inputs[inputIndex];
        if (cbButton.handler) {
            cbButton.handler(cbButton);
        }
    }
    buttonClick(button) {
        let shouldDismiss = true;
        if (button.handler) {
            // a handler has been provided, execute it
            // pass the handler the values from the inputs
            if (button.handler(this.getValues()) === false) {
                // if the return value of the handler is false then do not dismiss
                shouldDismiss = false;
            }
        }
        if (shouldDismiss) {
            this.dismiss(this.getValues(), button.role);
        }
    }
    getValues() {
        if (this.inputType === 'radio') {
            // this is an alert with radio buttons (single value select)
            // return the one value which is checked, otherwise undefined
            const checkedInput = this.inputs.find(i => i.checked);
            console.debug('returning', checkedInput ? checkedInput.value : undefined);
            return checkedInput ? checkedInput.value : undefined;
        }
        if (this.inputType === 'checkbox') {
            // this is an alert with checkboxes (multiple value select)
            // return an array of all the checked values
            console.debug('returning', this.inputs.filter(i => i.checked).map(i => i.value));
            return this.inputs.filter(i => i.checked).map(i => i.value);
        }
        if (this.inputs.length === 0) {
            // this is an alert without any options/inputs at all
            console.debug('returning', 'undefined');
            return undefined;
        }
        // this is an alert with text inputs
        // return an object of all the values with the input name as the key
        const values = {};
        this.inputs.forEach(i => {
            values[i.name] = i.value;
        });
        console.debug('returning', values);
        return values;
    }
    playAnimation(animationBuilder) {
        if (this.animation) {
            this.animation.destroy();
            this.animation = null;
        }
        return this.animationCtrl.create(animationBuilder, this.el).then(animation => {
            this.animation = animation;
            if (!this.willAnimate) {
                // if the duration is 0, it won't actually animate I don't think
                animation.duration(0);
            }
            return playAnimationAsync(animation);
        }).then(animation => {
            animation.destroy();
            this.animation = null;
        });
    }
    renderCheckbox(inputs) {
        if (inputs.length === 0)
            return null;
        return (h("div", { class: 'alert-checkbox-group' }, inputs.map((i, index) => (h("button", { onClick: () => this.cbClick(index), "aria-checked": i.checked, id: i.id, disabled: i.disabled, tabIndex: 0, role: 'checkbox', class: 'alert-tappable alert-checkbox alert-checkbox-button' },
            h("div", { class: 'alert-button-inner' },
                h("div", { class: 'alert-checkbox-icon' },
                    h("div", { class: 'alert-checkbox-inner' })),
                h("div", { class: 'alert-checkbox-label' }, i.label)))))));
    }
    renderRadio(inputs) {
        if (inputs.length === 0)
            return null;
        return (h("div", { class: 'alert-radio-group', role: 'radiogroup', "aria-labelledby": this.hdrId, "aria-activedescendant": this.activeId }, inputs.map((i, index) => (h("button", { onClick: () => this.rbClick(index), "aria-checked": i.checked, disabled: i.disabled, id: i.id, tabIndex: 0, class: 'alert-radio-button alert-tappable alert-radio', role: 'radio' },
            h("div", { class: 'alert-button-inner' },
                h("div", { class: 'alert-radio-icon' },
                    h("div", { class: 'alert-radio-inner' })),
                h("div", { class: 'alert-radio-label' }, i.label)))))));
    }
    renderInput(inputs) {
        if (inputs.length === 0)
            return null;
        return (h("div", { class: 'alert-input-group' }, inputs.map(i => (h("div", { class: 'alert-input-wrapper' },
            h("input", { placeholder: i.placeholder, value: i.value, type: i.type, min: i.min, max: i.max, id: i.id, disabled: i.disabled, tabIndex: 0, class: 'alert-input' }))))));
    }
    hostData() {
        const themedClasses = this.translucent ? createThemedClasses(this.mode, this.color, 'alert-translucent') : {};
        return {
            class: Object.assign({}, themedClasses, getClassMap(this.cssClass)),
            id: this.alertId
        };
    }
    render() {
        const hdrId = `${this.alertId}-hdr`;
        const subHdrId = `${this.alertId}-sub-hdr`;
        const msgId = `${this.alertId}-msg`;
        if (this.title || !this.subTitle) {
            this.hdrId = hdrId;
        }
        else if (this.subTitle) {
            this.hdrId = subHdrId;
        }
        const alertButtonGroupClass = {
            'alert-button-group': true,
            'alert-button-group-vertical': this.buttons.length > 2
        };
        const buttons = this.buttons.map(b => {
            if (typeof b === 'string') {
                return { text: b };
            }
            return b;
        })
            .filter(b => b !== null);
        this.inputs = this.inputs.map((i, index) => {
            return {
                type: i.type || 'text',
                name: i.name ? i.name : index + '',
                placeholder: i.placeholder ? i.placeholder : '',
                value: i.value ? i.value : '',
                label: i.label,
                checked: !!i.checked,
                disabled: !!i.disabled,
                id: i.id ? i.id : `alert-input-${this.alertId}-${index}`,
                handler: i.handler ? i.handler : null,
                min: i.min ? i.min : null,
                max: i.max ? i.max : null
            };
        }).filter(i => i !== null);
        // An alert can be created with several different inputs. Radios,
        // checkboxes and inputs are all accepted, but they cannot be mixed.
        const inputTypes = [];
        this.inputs.forEach(i => {
            if (inputTypes.indexOf(i.type) < 0) {
                inputTypes.push(i.type);
            }
        });
        if (inputTypes.length > 1 && (inputTypes.indexOf('checkbox') > -1 || inputTypes.indexOf('radio') > -1)) {
            console.warn(`Alert cannot mix input types: ${(inputTypes.join('/'))}. Please see alert docs for more info.`);
        }
        this.inputType = inputTypes.length > 0 ? inputTypes[0] : null;
        return [
            h("ion-backdrop", { tappable: this.enableBackdropDismiss }),
            h("div", { class: 'alert-wrapper' },
                h("div", { class: 'alert-head' },
                    this.title
                        ? h("h2", { id: hdrId, class: 'alert-title' }, this.title)
                        : null,
                    this.subTitle
                        ? h("h2", { id: subHdrId, class: 'alert-sub-title' }, this.subTitle)
                        : null),
                h("div", { id: msgId, class: 'alert-message', innerHTML: this.message }),
                (() => {
                    switch (this.inputType) {
                        case 'checkbox': return this.renderCheckbox(this.inputs);
                        case 'radio': return this.renderRadio(this.inputs);
                        default: return this.renderInput(this.inputs);
                    }
                })(),
                h("div", { class: alertButtonGroupClass }, buttons.map(b => h("button", { class: buttonClass(b), tabIndex: 0, onClick: () => this.buttonClick(b) },
                    h("span", { class: 'alert-button-inner' }, b.text)))))
        ];
    }
    static get is() { return "ion-alert"; }
    static get host() { return { "theme": "alert" }; }
    static get properties() { return { "animationCtrl": { "connect": "ion-animation-controller" }, "buttons": { "type": "Any", "attr": "buttons" }, "config": { "context": "config" }, "cssClass": { "type": String, "attr": "css-class" }, "dismiss": { "method": true }, "dom": { "context": "dom" }, "el": { "elementRef": true }, "enableBackdropDismiss": { "type": Boolean, "attr": "enable-backdrop-dismiss" }, "enterAnimation": { "type": "Any", "attr": "enter-animation" }, "inputs": { "type": "Any", "attr": "inputs", "mutable": true }, "leaveAnimation": { "type": "Any", "attr": "leave-animation" }, "message": { "type": String, "attr": "message" }, "present": { "method": true }, "subTitle": { "type": String, "attr": "sub-title" }, "title": { "type": String, "attr": "title" }, "translucent": { "type": Boolean, "attr": "translucent" }, "willAnimate": { "type": Boolean, "attr": "will-animate" } }; }
    static get events() { return [{ "name": "ionAlertDidLoad", "method": "ionAlertDidLoad", "bubbles": true, "cancelable": true, "composed": true }, { "name": "ionAlertDidPresent", "method": "ionAlertDidPresent", "bubbles": true, "cancelable": true, "composed": true }, { "name": "ionAlertWillPresent", "method": "ionAlertWillPresent", "bubbles": true, "cancelable": true, "composed": true }, { "name": "ionAlertWillDismiss", "method": "ionAlertWillDismiss", "bubbles": true, "cancelable": true, "composed": true }, { "name": "ionAlertDidDismiss", "method": "ionAlertDidDismiss", "bubbles": true, "cancelable": true, "composed": true }, { "name": "ionAlertDidUnload", "method": "ionAlertDidUnload", "bubbles": true, "cancelable": true, "composed": true }]; }
    static get style() { return "ion-alert {\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  position: absolute;\n  z-index: 1000;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  -ms-flex-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  -ms-touch-action: none;\n  touch-action: none;\n  contain: strict;\n  font-smoothing: antialiased;\n  -webkit-font-smoothing: antialiased;\n}\n\nion-alert.alert-top {\n  padding-top: 50px;\n  -webkit-box-align: start;\n  -webkit-align-items: flex-start;\n  -ms-flex-align: start;\n  align-items: flex-start;\n}\n\n.alert-wrapper {\n  z-index: 10;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-flex-direction: column;\n  -ms-flex-direction: column;\n  flex-direction: column;\n  min-width: 250px;\n  max-height: 90%;\n  opacity: 0;\n  contain: content;\n}\n\n.alert-title {\n  margin: 0;\n  padding: 0;\n}\n\n.alert-sub-title {\n  margin: 5px 0 0;\n  padding: 0;\n  font-weight: normal;\n}\n\n.alert-message {\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n  -webkit-overflow-scrolling: touch;\n  overflow-y: scroll;\n}\n\n.alert-input {\n  padding: 10px 0;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n  width: 100%;\n  border: 0;\n  font: inherit;\n  background: inherit;\n}\n\n.alert-button-group {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: horizontal;\n  -webkit-box-direction: normal;\n  -webkit-flex-direction: row;\n  -ms-flex-direction: row;\n  flex-direction: row;\n  width: 100%;\n}\n\n.alert-button-group-vertical {\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-flex-direction: column;\n  -ms-flex-direction: column;\n  flex-direction: column;\n  -webkit-flex-wrap: nowrap;\n  -ms-flex-wrap: nowrap;\n  flex-wrap: nowrap;\n}\n\n.alert-button {\n  margin: 0;\n  z-index: 0;\n  display: block;\n  border: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n\n.alert-button-inner {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: horizontal;\n  -webkit-box-direction: normal;\n  -webkit-flex-flow: row nowrap;\n  -ms-flex-flow: row nowrap;\n  flex-flow: row nowrap;\n  -webkit-flex-shrink: 0;\n  -ms-flex-negative: 0;\n  flex-shrink: 0;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  -ms-flex-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n}\n\n.alert-tappable {\n  text-align: left;\n  text-align: start;\n  -moz-appearance: none;\n  -ms-appearance: none;\n  -webkit-appearance: none;\n  appearance: none;\n  margin: 0;\n  padding: 0;\n  width: 100%;\n  border: 0;\n  font-size: inherit;\n  line-height: initial;\n  background: transparent;\n}\n\n.alert-button:active, .alert-button:focus,\n.alert-checkbox:active,\n.alert-checkbox:focus,\n.alert-input:active,\n.alert-input:focus,\n.alert-radio:active,\n.alert-radio:focus {\n  outline: none;\n}\n\n.alert-radio-icon,\n.alert-checkbox-icon,\n.alert-checkbox-inner {\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.alert-ios {\n  font-family: -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", \"Roboto\", sans-serif;\n  font-size: 14px;\n}\n\n.alert-ios .alert-wrapper {\n  border-radius: 13px;\n  overflow: hidden;\n  max-width: 270px;\n  background-color: var(--ion-overlay-ios-background-color, var(--ion-overlay-background-color, #f9f9f9));\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\n\n.alert-translucent-ios .alert-wrapper {\n  background: rgba(255, 255, 255, var(--ion-alpha-ios-highest, var(--ion-alpha-highest, 0.9)));\n  backdrop-filter: saturate(180%) blur(20px);\n  -webkit-backdrop-filter: saturate(180%) blur(20px);\n}\n\n.alert-ios .alert-head {\n  text-align: center;\n  padding: 12px 16px 7px;\n}\n\n.alert-ios .alert-title {\n  margin-top: 8px;\n  font-size: 17px;\n  font-weight: 600;\n}\n\n.alert-ios .alert-sub-title {\n  font-size: 14px;\n  color: var(--ion-text-ios-color-step-400, var(--ion-text-color-step-400, #666666));\n}\n\n.alert-ios .alert-message,\n.alert-ios .alert-input-group {\n  padding: 0 16px 21px;\n  text-align: center;\n  font-size: 13px;\n  color: inherit;\n}\n\n.alert-ios .alert-message {\n  max-height: 240px;\n}\n\n.alert-ios .alert-message:empty {\n  padding: 0 0 12px;\n}\n\n.alert-ios .alert-input {\n  -moz-appearance: none;\n  -ms-appearance: none;\n  -webkit-appearance: none;\n  appearance: none;\n  border-radius: 4px;\n  margin-top: 10px;\n  padding: 6px;\n  border: 0.55px solid var(--ion-background-ios-color-step-250, var(--ion-background-color-step-250, #bfbfbf));\n  background-color: var(--ion-background-ios-color, var(--ion-background-color, #fff));\n}\n\n.alert-ios .alert-input::-moz-placeholder {\n  color: var(--ion-placeholder-text-ios-color, var(--ion-placeholder-text-color, #999));\n}\n\n.alert-ios .alert-input:-ms-input-placeholder {\n  color: var(--ion-placeholder-text-ios-color, var(--ion-placeholder-text-color, #999));\n}\n\n.alert-ios .alert-input::-webkit-input-placeholder {\n  text-indent: 0;\n  color: var(--ion-placeholder-text-ios-color, var(--ion-placeholder-text-color, #999));\n}\n\n.alert-ios .alert-radio-group,\n.alert-ios .alert-checkbox-group {\n  overflow: scroll;\n  max-height: 240px;\n  border-top: 0.55px solid rgba(0, 0, 0, var(--ion-alpha-ios-low, var(--ion-alpha-low, 0.1)));\n  -webkit-overflow-scrolling: touch;\n}\n\n.alert-ios .alert-tappable {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: -ms-flexbox;\n  display: flex;\n  height: 44px;\n  contain: strict;\n}\n\n.alert-ios .alert-radio-label {\n  padding: 13px;\n  overflow: hidden;\n  -webkit-box-flex: 1;\n  -webkit-flex: 1;\n  -ms-flex: 1;\n  flex: 1;\n  -webkit-box-ordinal-group: 1;\n  -webkit-order: 0;\n  -ms-flex-order: 0;\n  order: 0;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--ion-text-ios-color, var(--ion-text-color, #000));\n}\n\n.alert-ios [aria-checked=true] .alert-radio-label {\n  color: var(--ion-color-ios-primary, var(--ion-color-primary, #488aff));\n}\n\n.alert-ios .alert-radio-icon {\n  position: relative;\n  -webkit-box-ordinal-group: 2;\n  -webkit-order: 1;\n  -ms-flex-order: 1;\n  order: 1;\n  min-width: 30px;\n}\n\n.alert-ios [aria-checked=true] .alert-radio-inner {\n  left: 7px;\n  top: -7px;\n  position: absolute;\n  width: 6px;\n  height: 12px;\n  border-width: 2px;\n  border-top-width: 0;\n  border-left-width: 0;\n  border-style: solid;\n  border-color: var(--ion-color-ios-primary, var(--ion-color-primary, #488aff));\n  -webkit-transform: rotate(45deg);\n  transform: rotate(45deg);\n}\n\n.alert-ios .alert-checkbox-label {\n  padding: 13px;\n  overflow: hidden;\n  -webkit-box-flex: 1;\n  -webkit-flex: 1;\n  -ms-flex: 1;\n  flex: 1;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--ion-text-ios-color, var(--ion-text-color, #000));\n}\n\n.alert-ios .alert-checkbox-icon {\n  border-radius: 50%;\n  margin: 10px 6px 10px 16px;\n  position: relative;\n  width: 21px;\n  height: 21px;\n  border-width: 0.55px;\n  border-style: solid;\n  border-color: var(--ion-item-ios-border-color, var(--ion-item-border-color, #c8c7cc));\n  background-color: var(--ion-item-ios-background-color, var(--ion-background-ios-color, var(--ion-background-color, #fff)));\n  contain: strict;\n}\n\n.alert-ios [aria-checked=true] .alert-checkbox-icon {\n  border-color: var(--ion-color-ios-primary, var(--ion-color-primary, #488aff));\n  background-color: var(--ion-color-ios-primary, var(--ion-color-primary, #488aff));\n}\n\n.alert-ios [aria-checked=true] .alert-checkbox-inner {\n  left: 8px;\n  top: 4px;\n  position: absolute;\n  width: 4px;\n  height: 9px;\n  border-width: 0.55px;\n  border-top-width: 0;\n  border-left-width: 0;\n  border-style: solid;\n  border-color: var(--ion-background-ios-color, var(--ion-background-color, #fff));\n  -webkit-transform: rotate(45deg);\n  transform: rotate(45deg);\n}\n\n.alert-ios .alert-button-group {\n  margin-right: -0.55px;\n  -webkit-flex-wrap: wrap;\n  -ms-flex-wrap: wrap;\n  flex-wrap: wrap;\n}\n\n.alert-ios .alert-button {\n  margin: 0;\n  border-radius: 0;\n  overflow: hidden;\n  -webkit-box-flex: 1;\n  -webkit-flex: 1 1 auto;\n  -ms-flex: 1 1 auto;\n  flex: 1 1 auto;\n  min-width: 50%;\n  height: 44px;\n  border-top: 0.55px solid rgba(0, 0, 0, var(--ion-alpha-ios-low, var(--ion-alpha-low, 0.1)));\n  border-right: 0.55px solid rgba(0, 0, 0, var(--ion-alpha-ios-low, var(--ion-alpha-low, 0.1)));\n  font-size: 17px;\n  color: var(--ion-color-ios-primary, var(--ion-color-primary, #488aff));\n  background-color: transparent;\n}\n\n.alert-ios .alert-button:last-child {\n  border-right: 0;\n  font-weight: bold;\n}\n\n.alert-ios .alert-button.activated {\n  background-color: rgba(0, 0, 0, var(--ion-alpha-ios-lowest, var(--ion-alpha-lowest, 0.06)));\n}"; }
    static get styleMode() { return "ios"; }
}
function buttonClass(button) {
    return Object.assign({ 'alert-button': true }, getClassMap(button.cssClass));
}

let ids = 0;
const alerts = new Map();
class AlertController {
    alertWillPresent(ev) {
        alerts.set(ev.target.alertId, ev.target);
    }
    alertWillDismiss(ev) {
        alerts.delete(ev.target.alertId);
    }
    escapeKeyUp() {
        removeLastAlert();
    }
    /*
     * Create an alert overlay with alert options.
     */
    create(opts) {
        // create ionic's wrapping ion-alert component
        const alertElement = document.createElement('ion-alert');
        // give this alert a unique id
        alertElement.alertId = ids++;
        // convert the passed in alert options into props
        // that get passed down into the new alert
        Object.assign(alertElement, opts);
        // append the alert element to the document body
        const appRoot = document.querySelector('ion-app') || document.body;
        appRoot.appendChild(alertElement);
        return alertElement.componentOnReady();
    }
    /*
     * Dismiss the open alert overlay.
     */
    dismiss(data, role, alertId = -1) {
        alertId = alertId >= 0 ? alertId : getHighestId();
        const alert = alerts.get(alertId);
        if (!alert) {
            return Promise.reject('alert does not exist');
        }
        return alert.dismiss(data, role);
    }
    /*
     * Get the most recently opened alert overlay.
     */
    getTop() {
        return alerts.get(getHighestId());
    }
    static get is() { return "ion-alert-controller"; }
    static get properties() { return { "create": { "method": true }, "dismiss": { "method": true }, "getTop": { "method": true } }; }
}
function getHighestId() {
    let minimum = -1;
    alerts.forEach((_alert, id) => {
        if (id > minimum) {
            minimum = id;
        }
    });
    return minimum;
}
function removeLastAlert() {
    const toRemove = alerts.get(getHighestId());
    return toRemove ? toRemove.dismiss() : Promise.resolve();
}

export { Alert as IonAlert, AlertController as IonAlertController };
