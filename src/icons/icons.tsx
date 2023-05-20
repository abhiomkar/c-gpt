import { h, FunctionComponent } from 'preact';

export const SendIcon: FunctionComponent<{ height?: number, width?: number }> = ({ height = 24, width = 24 }) => {
  return (
    <svg height={height} width={width} class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">
      <path d="M120 896V256l760 320-760 320Zm60-93 544-227-544-230v168l242 62-242 60v167Zm0 0V346v457Z" />
    </svg>
  );
}

export const UserIcon: FunctionComponent<{ height?: number, width?: number }> = ({ height = 24, width = 24 }) => {
  return (
    <svg height={height} width={width} class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">
      <path d="M480 575q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42ZM160 896v-94q0-38 19-65t49-41q67-30 128.5-45T480 636q62 0 123 15.5t127.921 44.694q31.301 14.126 50.19 40.966Q800 764 800 802v94H160Zm60-60h520v-34q0-16-9.5-30.5T707 750q-64-31-117-42.5T480 696q-57 0-111 11.5T252 750q-14 7-23 21.5t-9 30.5v34Zm260-321q39 0 64.5-25.5T570 425q0-39-25.5-64.5T480 335q-39 0-64.5 25.5T390 425q0 39 25.5 64.5T480 515Zm0-90Zm0 411Z"/>
    </svg>
  );
}

export const AssistantIcon: FunctionComponent<{ height?: number, width?: number }> = ({ height = 24, width = 24 }) => {
  return (
    <svg height={height} width={width} class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960">
      <path d="m384 679 50.079-108.921L543 520l-108.921-50.079L384 361l-50.079 108.921L225 520l108.921 50.079L384 679Zm0 145-95-209-209-95 209-95 95-209 95 209 209 95-209 95-95 209Zm344 112-47-105-105-47 105-48 47-104 48 104 104 48-104 47-48 105ZM384 520Z"/>
    </svg>
  );
}

export const TypingAnimation = () => {
  return (
    <div class="flex gap-0.5">
      <span class="flex h-2 w-2 animate-bounce rounded-full bg-gray-500"></span>
      <span class="flex h-2 w-2 animate-bounce rounded-full bg-gray-500 animation-delay-100"></span>
      <span class="flex h-2 w-2 animate-bounce rounded-full bg-gray-500 animation-delay-200"></span>
    </div>
  );
}