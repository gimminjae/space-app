import type { ICommand } from '@uiw/react-md-editor';
import type { Locale } from './routing';
const labels:Record<string,string>={bold:'굵게',italic:'기울임',strikethrough:'취소선',hr:'구분선',title:'제목 수준',heading1:'제목 1',heading2:'제목 2',heading3:'제목 3',heading4:'제목 4',heading5:'제목 5',heading6:'제목 6',link:'링크',quote:'인용',code:'인라인 코드',codeBlock:'코드 블록',image:'이미지',table:'표','unordered-list':'글머리 기호 목록','ordered-list':'번호 목록','checked-list':'체크 목록',comment:'주석',issue:'이슈',help:'Markdown 도움말',edit:'편집',live:'편집과 미리보기',preview:'미리보기',fullscreen:'전체 화면'};
export function localizeCommand(command:ICommand,locale:Locale):ICommand{
 const label=locale==='ko'?labels[command.name||'']:undefined;
 const {children,...base}=command;
 const props={...base,...(label?{buttonProps:{...command.buttonProps,title:label,'aria-label':label}}:{})};
 if(Array.isArray(children))return {...props,children:children.map(c=>localizeCommand(c,locale))};
 return {...props,children};
}
